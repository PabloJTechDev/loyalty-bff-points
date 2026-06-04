import { randomUUID } from 'crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { logEvent } from '../../../common/logging/json-log';
import { businessTransactionsTotal } from '../../../common/metrics/http-metrics';
import { CoreCustomerClient } from '../clients/core-customer.client';
import { CustomerEnrollmentTraceService } from './customer-enrollment-trace.service';
import type {
  CustomerPasswordChangeReceiptDto,
  CustomerPasswordChangeTraceDetailsDto,
  CustomerPasswordChangeTraceDto,
} from '../dto/customer-password-change.dto';
import type { CustomerPasswordChangeRequestDto } from '../dto/customer-password-change.dto';

@Injectable()
export class CustomerPasswordChangeService {
  private readonly traces: CustomerPasswordChangeTraceDto[] = [];

  constructor(
    private readonly coreCustomerClient: CoreCustomerClient,
    private readonly customerEnrollmentTraceService: CustomerEnrollmentTraceService,
  ) {}

  async register(
    input: CustomerPasswordChangeRequestDto = {},
  ): Promise<CustomerPasswordChangeReceiptDto> {
    const transactionId = input.transactionId?.trim();

    if (!transactionId) {
      throw new NotFoundException('transactionId is required');
    }

    const enrollment = await this.customerEnrollmentTraceService.getByTransactionId(
      transactionId,
    );

    if (!enrollment) {
      throw new NotFoundException(
        `Enrollment trace not found for transactionId ${transactionId}`,
      );
    }

    const createdAt = new Date().toISOString();
    const requestId = `pwd_${randomUUID()}`;
    const coreCustomer = await this.coreCustomerClient.ping();

    logEvent('password-change.register.started', {
      requestId,
      transactionId,
      coreAvailable: coreCustomer.available,
    });

    const trace: CustomerPasswordChangeTraceDto = {
      requestId,
      transactionId,
      createdAt,
      handoff: {
        status: coreCustomer.available ? 'ready_to_send' : 'pending_core',
        targetBaseUrl: coreCustomer.baseUrl,
      },
      payloadPreparedForCore: {
        requestId,
        transactionId,
        customerEmailHash: enrollment.trace.payloadPreparedForCore.customerEmailHash,
      },
    };

    if (coreCustomer.available) {
      const handoff = await this.coreCustomerClient.handoffPasswordChange(
        trace.payloadPreparedForCore,
      );
      trace.handoff = {
        ...trace.handoff,
        status: handoff.accepted ? 'sent_to_core' : 'core_rejected',
        deliveredAt: new Date().toISOString(),
        responseStatusCode: handoff.statusCode,
      };
      logEvent('password-change.register.handoff', {
        requestId,
        transactionId,
        status: trace.handoff.status,
        statusCode: trace.handoff.responseStatusCode,
      });
    }

    businessTransactionsTotal.inc({
      flow: 'password_change',
      outcome: trace.handoff.status,
    });

    this.traces.unshift(trace);
    if (this.traces.length > 20) {
      this.traces.length = 20;
    }

    logEvent('password-change.register.completed', {
      requestId,
      transactionId,
      handoffStatus: trace.handoff.status,
    });

    return {
      ...trace,
      outcome: {
        accepted: trace.handoff.status === 'sent_to_core',
        nextStep:
          trace.handoff.status === 'sent_to_core'
            ? 'go_to_password_change_tracking'
            : 'retry_enrollment_lookup',
      },
    };
  }

  async getByRequestId(
    requestId: string,
  ): Promise<CustomerPasswordChangeTraceDetailsDto | null> {
    const trace = this.traces.find((item) => item.requestId === requestId);

    if (!trace) {
      return null;
    }

    const coreRecord = await this.coreCustomerClient.getPasswordChangeByRequestId(
      requestId,
    );

    return {
      trace,
      coreRecord,
    };
  }
}
