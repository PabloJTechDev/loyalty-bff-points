import { randomUUID } from 'crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { logEvent } from '../../../common/logging/json-log';
import { businessTransactionsTotal } from '../../../common/metrics/http-metrics';
import { CoreCustomerClient } from '../clients/core-customer.client';
import { CustomerPasswordChangeService } from './customer-password-change.service';
import { customerProfileSummaryMock } from '../mocks/customer.mock';
import type {
  CustomerLoginReceiptDto,
  CustomerLoginTraceDetailsDto,
  CustomerLoginTraceDto,
} from '../dto/customer-login.dto';
import type { CustomerLoginRequestDto } from '../dto/customer-login.dto';

@Injectable()
export class CustomerLoginService {
  private readonly traces: CustomerLoginTraceDto[] = [];

  constructor(
    private readonly coreCustomerClient: CoreCustomerClient,
    private readonly customerPasswordChangeService: CustomerPasswordChangeService,
  ) {}

  async register(
    input: CustomerLoginRequestDto = {},
  ): Promise<CustomerLoginReceiptDto> {
    const requestId = input.requestId?.trim();

    if (!requestId) {
      throw new NotFoundException('requestId is required');
    }

    const passwordChange = await this.customerPasswordChangeService.getByRequestId(
      requestId,
    );

    if (!passwordChange) {
      throw new NotFoundException(
        `Password change trace not found for requestId ${requestId}`,
      );
    }

    const createdAt = new Date().toISOString();
    const loginId = `login_${randomUUID()}`;
    const coreCustomer = await this.coreCustomerClient.ping();

    logEvent('login.register.started', {
      loginId,
      requestId,
      transactionId: passwordChange.trace.transactionId,
      coreAvailable: coreCustomer.available,
    });

    const trace: CustomerLoginTraceDto = {
      loginId,
      requestId,
      transactionId: passwordChange.trace.transactionId,
      createdAt,
      session: {
        status: coreCustomer.available ? 'ready_to_authenticate' : 'pending_core',
        targetBaseUrl: coreCustomer.baseUrl,
      },
      customerSnapshot: {
        customerId: customerProfileSummaryMock.customer.id,
        fullName: customerProfileSummaryMock.customer.fullName,
        maskedEmail: customerProfileSummaryMock.customer.email.replace(
          /^(.{2}).*(@.*)$/,
          '$1***$2',
        ),
        tierName: customerProfileSummaryMock.membership.tier.name,
      },
      payloadPreparedForCore: {
        loginId,
        requestId,
        transactionId: passwordChange.trace.transactionId,
        customerEmailHash:
          passwordChange.trace.payloadPreparedForCore.customerEmailHash,
      },
    };

    if (coreCustomer.available) {
      // Resolve real customerId by emailHash before handoff
      const emailHash = trace.payloadPreparedForCore.customerEmailHash;
      const customerRecord = await this.coreCustomerClient.getCustomerByEmailHash(emailHash);
      if (customerRecord?.customerId) {
        trace.customerSnapshot = {
          ...trace.customerSnapshot,
          customerId: customerRecord.customerId,
          tierName: customerRecord.loyaltyTier,
        };
        logEvent('login.customer-id.resolved', {
          loginId,
          customerId: customerRecord.customerId,
          tier: customerRecord.loyaltyTier,
        });
      }

      const handoff = await this.coreCustomerClient.handoffLogin(
        trace.payloadPreparedForCore,
      );
      trace.session = {
        ...trace.session,
        status: handoff.accepted ? 'authenticated' : 'core_rejected',
        authenticatedAt: new Date().toISOString(),
        responseStatusCode: handoff.statusCode,
      };
      logEvent('login.register.handoff', {
        loginId,
        requestId,
        transactionId: trace.transactionId,
        status: trace.session.status,
        statusCode: trace.session.responseStatusCode,
      });
    }

    businessTransactionsTotal.inc({
      flow: 'login',
      outcome: trace.session.status,
    });

    this.traces.unshift(trace);
    if (this.traces.length > 20) {
      this.traces.length = 20;
    }

    logEvent('login.register.completed', {
      loginId,
      requestId,
      transactionId: trace.transactionId,
      sessionStatus: trace.session.status,
    });

    return {
      ...trace,
      outcome: {
        authenticated: trace.session.status === 'authenticated',
        nextStep:
          trace.session.status === 'authenticated'
            ? 'go_to_authenticated_home'
            : 'retry_password_change_lookup',
      },
    };
  }

  async getByLoginId(
    loginId: string,
  ): Promise<CustomerLoginTraceDetailsDto | null> {
    const trace = this.traces.find((item) => item.loginId === loginId);

    if (!trace) {
      return null;
    }

    const coreRecord = await this.coreCustomerClient.getLoginByLoginId(loginId);

    return {
      trace,
      coreRecord,
    };
  }
}
