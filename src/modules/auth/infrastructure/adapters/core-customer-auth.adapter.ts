import { randomUUID } from 'crypto'
import { Injectable, NotFoundException } from '@nestjs/common'
import { logEvent } from '../../../../shared/logging/json-log'
import { businessTransactionsTotal } from '../../../../shared/metrics/http-metrics'
import { CoreCustomerClient } from '../../../../shared/infrastructure/core-customer.client'
import { CoreCustomerEnrollmentAdapter } from '../../../enrollment/infrastructure/adapters/core-customer-enrollment.adapter'
import type {
  IAuthRepository,
  PasswordChangeInput,
  PasswordChangeReceiptDto,
  PasswordChangeTraceDto,
  PasswordChangeTraceDetailsDto,
  LoginInput,
  LoginReceiptDto,
  LoginTraceDto,
  LoginTraceDetailsDto,
} from '../../domain/ports/auth.repository'

// Mock snapshot for customer data when core is unavailable
const customerProfileSummaryMock = {
  customer: {
    id: 'cust_001',
    fullName: 'Pablo Valverde',
    email: 'pablo@example.com',
    tierName: 'Gold',
  },
  membership: {
    tier: {
      name: 'Gold',
    },
  },
}

@Injectable()
export class CoreCustomerAuthAdapter implements IAuthRepository {
  private readonly passwordChangeTraces: PasswordChangeTraceDto[] = []
  private readonly loginTraces: LoginTraceDto[] = []

  constructor(
    private readonly coreCustomerClient: CoreCustomerClient,
    private readonly enrollmentAdapter: CoreCustomerEnrollmentAdapter,
  ) {}

  // ── Password Change ──────────────────────────────────────────────────────────

  async registerPasswordChange(
    input: PasswordChangeInput = {},
  ): Promise<PasswordChangeReceiptDto> {
    const transactionId = input.transactionId?.trim()

    if (!transactionId) {
      throw new NotFoundException('transactionId is required')
    }

    const enrollment = await this.enrollmentAdapter.getByTransactionId(transactionId)

    if (!enrollment) {
      throw new NotFoundException(
        `Enrollment trace not found for transactionId ${transactionId}`,
      )
    }

    const createdAt = new Date().toISOString()
    const requestId = `pwd_${randomUUID()}`
    const coreCustomer = await this.coreCustomerClient.ping()

    logEvent('password-change.register.started', {
      requestId,
      transactionId,
      coreAvailable: coreCustomer.available,
    })

    const trace: PasswordChangeTraceDto = {
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
    }

    if (coreCustomer.available) {
      const handoff = await this.coreCustomerClient.handoffPasswordChange(
        trace.payloadPreparedForCore,
      )
      trace.handoff = {
        ...trace.handoff,
        status: handoff.accepted ? 'sent_to_core' : 'core_rejected',
        deliveredAt: new Date().toISOString(),
        responseStatusCode: handoff.statusCode,
      }
      logEvent('password-change.register.handoff', {
        requestId,
        transactionId,
        status: trace.handoff.status,
        statusCode: trace.handoff.responseStatusCode,
      })
    }

    businessTransactionsTotal.inc({
      flow: 'password_change',
      outcome: trace.handoff.status,
    })

    this.passwordChangeTraces.unshift(trace)
    if (this.passwordChangeTraces.length > 20) {
      this.passwordChangeTraces.length = 20
    }

    logEvent('password-change.register.completed', {
      requestId,
      transactionId,
      handoffStatus: trace.handoff.status,
    })

    return {
      ...trace,
      outcome: {
        accepted: trace.handoff.status === 'sent_to_core',
        nextStep:
          trace.handoff.status === 'sent_to_core'
            ? 'go_to_password_change_tracking'
            : 'retry_enrollment_lookup',
      },
    }
  }

  async getPasswordChangeByRequestId(
    requestId: string,
  ): Promise<PasswordChangeTraceDetailsDto | null> {
    const trace = this.passwordChangeTraces.find((item) => item.requestId === requestId)

    if (!trace) {
      return null
    }

    const coreRecord = await this.coreCustomerClient.getPasswordChangeByRequestId(requestId)

    return {
      trace,
      coreRecord,
    }
  }

  // ── Login ────────────────────────────────────────────────────────────────────

  async registerLogin(input: LoginInput = {}): Promise<LoginReceiptDto> {
    const requestId = input.requestId?.trim()

    if (!requestId) {
      throw new NotFoundException('requestId is required')
    }

    const passwordChange = await this.getPasswordChangeByRequestId(requestId)

    if (!passwordChange) {
      throw new NotFoundException(
        `Password change trace not found for requestId ${requestId}`,
      )
    }

    const createdAt = new Date().toISOString()
    const loginId = `login_${randomUUID()}`
    const coreCustomer = await this.coreCustomerClient.ping()

    logEvent('login.register.started', {
      loginId,
      requestId,
      transactionId: passwordChange.trace.transactionId,
      coreAvailable: coreCustomer.available,
    })

    const trace: LoginTraceDto = {
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
        customerEmailHash: passwordChange.trace.payloadPreparedForCore.customerEmailHash,
      },
    }

    if (coreCustomer.available) {
      const emailHash = trace.payloadPreparedForCore.customerEmailHash
      const customerRecord = await this.coreCustomerClient.getCustomerByEmailHash(emailHash)
      if (customerRecord?.customerId) {
        trace.customerSnapshot = {
          ...trace.customerSnapshot,
          customerId: customerRecord.customerId,
          tierName: customerRecord.loyaltyTier,
        }
        logEvent('login.customer-id.resolved', {
          loginId,
          customerId: customerRecord.customerId,
          tier: customerRecord.loyaltyTier,
        })
      }

      const handoff = await this.coreCustomerClient.handoffLogin(
        trace.payloadPreparedForCore,
      )
      trace.session = {
        ...trace.session,
        status: handoff.accepted ? 'authenticated' : 'core_rejected',
        authenticatedAt: new Date().toISOString(),
        responseStatusCode: handoff.statusCode,
      }
      logEvent('login.register.handoff', {
        loginId,
        requestId,
        transactionId: trace.transactionId,
        status: trace.session.status,
        statusCode: trace.session.responseStatusCode,
      })
    }

    businessTransactionsTotal.inc({
      flow: 'login',
      outcome: trace.session.status,
    })

    this.loginTraces.unshift(trace)
    if (this.loginTraces.length > 20) {
      this.loginTraces.length = 20
    }

    logEvent('login.register.completed', {
      loginId,
      requestId,
      transactionId: trace.transactionId,
      sessionStatus: trace.session.status,
    })

    return {
      ...trace,
      outcome: {
        authenticated: trace.session.status === 'authenticated',
        nextStep:
          trace.session.status === 'authenticated'
            ? 'go_to_authenticated_home'
            : 'retry_password_change_lookup',
      },
    }
  }

  async getLoginByLoginId(loginId: string): Promise<LoginTraceDetailsDto | null> {
    const trace = this.loginTraces.find((item) => item.loginId === loginId)

    if (!trace) {
      return null
    }

    const coreRecord = await this.coreCustomerClient.getLoginByLoginId(loginId)

    return {
      trace,
      coreRecord,
    }
  }
}
