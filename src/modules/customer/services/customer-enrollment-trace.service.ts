import { createHash, randomUUID } from 'crypto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { logEvent } from '../../../common/logging/json-log';
import { businessTransactionsTotal } from '../../../common/metrics/http-metrics';
import { CoreCustomerClient } from '../clients/core-customer.client';
import type {
  CustomerEnrollmentReceiptDto,
  CustomerEnrollmentTraceDetailsDto,
  CustomerEnrollmentTraceDto,
  CustomerEnrollmentTraceListResponseDto,
} from '../dto/customer-enrollment-trace.dto';
import type { CustomerEnrollmentRequestDto } from '../dto/customer-enrollment-request.dto';

@Injectable()
export class CustomerEnrollmentTraceService {
  private readonly defaultEmail = 'inscripcion@pablov.dev';
  private readonly traces: CustomerEnrollmentTraceDto[] = [];

  constructor(private readonly coreCustomerClient: CoreCustomerClient) {}

  async register(
    input: CustomerEnrollmentRequestDto = {},
  ): Promise<CustomerEnrollmentReceiptDto> {
    const email = this.normalizeEmail(input.email);
    this.validatePasswordSetup(input.password, input.confirmPassword);
    const createdAt = new Date().toISOString();
    const transactionId = `txn_${randomUUID()}`;
    const emailHash = createHash('sha256').update(email).digest('hex');
    const coreCustomer = await this.coreCustomerClient.ping();

    logEvent('enrollment.register.started', {
      transactionId,
      email,
      coreAvailable: coreCustomer.available,
    });

    const trace: CustomerEnrollmentTraceDto = {
      transactionId,
      email,
      createdAt,
      handoff: {
        status: coreCustomer.available ? 'ready_to_send' : 'pending_core',
        targetBaseUrl: coreCustomer.baseUrl,
      },
      payloadPreparedForCore: {
        transactionId,
        customerEmailHash: emailHash,
      },
      integrations: {
        coreCustomer,
      },
    };

    if (coreCustomer.available) {
      const handoff = await this.coreCustomerClient.handoffEnrollment(
        trace.payloadPreparedForCore,
      );
      trace.handoff = {
        ...trace.handoff,
        status: handoff.accepted ? 'sent_to_core' : 'core_rejected',
        deliveredAt: new Date().toISOString(),
        responseStatusCode: handoff.statusCode,
      };
      logEvent('enrollment.register.handoff', {
        transactionId,
        status: trace.handoff.status,
        statusCode: trace.handoff.responseStatusCode,
      });
    }

    businessTransactionsTotal.inc({
      flow: 'enrollment',
      outcome: trace.handoff.status,
    });

    this.traces.unshift(trace);
    if (this.traces.length > 20) {
      this.traces.length = 20;
    }

    logEvent('enrollment.register.completed', {
      transactionId,
      emailHash,
      handoffStatus: trace.handoff.status,
    });

    return {
      ...trace,
      verification: {
        emailHash,
        shownOnce: true,
      },
    };
  }

  list(): CustomerEnrollmentTraceListResponseDto {
    return {
      defaultEmail: this.defaultEmail,
      total: this.traces.length,
      items: this.traces,
    };
  }

  async getByTransactionId(
    transactionId: string,
  ): Promise<CustomerEnrollmentTraceDetailsDto | null> {
    const trace = this.traces.find(
      (item) => item.transactionId === transactionId,
    );

    if (!trace) {
      return null;
    }

    const coreRecord =
      await this.coreCustomerClient.getEnrollmentByTransactionId(transactionId);

    return {
      trace,
      coreRecord,
    };
  }

  private normalizeEmail(email?: string): string {
    const candidate = email?.trim().toLowerCase();
    return candidate && candidate.includes('@') ? candidate : this.defaultEmail;
  }

  private validatePasswordSetup(password?: string, confirmPassword?: string) {
    const normalizedPassword = password?.trim() ?? '';
    const normalizedConfirmPassword = confirmPassword?.trim() ?? '';

    if (!normalizedPassword || !normalizedConfirmPassword) {
      throw new BadRequestException('password and confirmPassword are required');
    }

    if (normalizedPassword.length < 8) {
      throw new BadRequestException('password must contain at least 8 characters');
    }

    if (normalizedPassword !== normalizedConfirmPassword) {
      throw new BadRequestException('password and confirmPassword must match');
    }
  }
}
