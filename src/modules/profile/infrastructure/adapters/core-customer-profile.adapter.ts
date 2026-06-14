import { Injectable } from '@nestjs/common'
import { logEvent } from '../../../../shared/logging/json-log'
import { businessTransactionsTotal } from '../../../../shared/metrics/http-metrics'
import { CoreCustomerClient } from '../../../../shared/infrastructure/core-customer.client'
import { CoreCustomerAuthAdapter } from '../../../auth/infrastructure/adapters/core-customer-auth.adapter'
import type {
  IProfileRepository,
  ProfileSummaryQuery,
  ProfileSummaryResponseDto,
  ProfileSummarySource,
  HomeResponseDto,
  ProfileIntegrationStatus,
  CustomerProfileSummaryCoreResponseDto,
} from '../../domain/ports/profile.repository'

const customerHomeMock = {
  customer: {
    id: 'cust_001',
    firstName: 'Pablo',
    fullName: 'Pablo Valverde',
  },
  membership: {
    status: 'active',
    tier: {
      code: 'gold',
      name: 'Gold',
    },
  },
  wallet: {
    availablePoints: 15200,
    expiringPoints: 1200,
    expiringAt: '2026-06-30',
  },
  tierProgress: {
    current: 'Gold',
    next: 'Platinum',
    progressPercentage: 68,
    missingPoints: 3200,
  },
  recentActivity: [
    {
      id: 'trx_001',
      type: 'earn',
      description: 'Compra en comercio asociado',
      points: 450,
      occurredAt: '2026-05-28T12:30:00Z',
    },
  ],
  primaryAction: {
    label: 'Ver wallet',
    target: '/wallet',
  },
}

const customerProfileSummaryMock = {
  customer: {
    id: 'cust_001',
    documentType: 'RUT',
    documentNumberMasked: '12.***.***-K',
    fullName: 'Pablo Valverde',
    email: 'pablo@example.com',
    phoneMasked: '+56 9 **** 1234',
  },
  membership: {
    status: 'active',
    joinedAt: '2025-07-14',
    tier: {
      code: 'gold',
      name: 'Gold',
    },
  },
}

@Injectable()
export class CoreCustomerProfileAdapter implements IProfileRepository {
  constructor(
    private readonly coreCustomerClient: CoreCustomerClient,
    private readonly authAdapter: CoreCustomerAuthAdapter,
  ) {}

  async getHome(): Promise<HomeResponseDto> {
    const coreStatus = await this.coreCustomerClient.ping()

    return {
      ...customerHomeMock,
      source: coreStatus.available ? 'core-customer' : 'mock',
      integrations: {
        coreCustomer: coreStatus,
      },
    }
  }

  async getProfileSummary(
    query: ProfileSummaryQuery = {},
  ): Promise<ProfileSummaryResponseDto> {
    const requestedCustomerId = query.customerId?.trim()
    const requestedLoginId = query.loginId?.trim()
    const coreStatus = await this.coreCustomerClient.ping()
    const resolvedCustomerId = await this.resolveCustomerId(
      requestedCustomerId,
      requestedLoginId,
    )

    logEvent('profile-summary.fetch.started', {
      customerId: requestedCustomerId,
      loginId: requestedLoginId,
      resolvedCustomerId,
      coreAvailable: coreStatus.available,
    })

    if (coreStatus.available && resolvedCustomerId) {
      const coreProfileSummary =
        await this.coreCustomerClient.getProfileSummaryByCustomerId(resolvedCustomerId)

      if (coreProfileSummary) {
        businessTransactionsTotal.inc({
          flow: 'profile_summary',
          outcome: 'served_from_core',
        })

        logEvent('profile-summary.fetch.completed', {
          customerId: requestedCustomerId,
          loginId: requestedLoginId,
          resolvedCustomerId,
          source: 'core-customer',
        })

        return this.mapCoreProfileSummary(coreProfileSummary, coreStatus)
      }
    }

    const fallbackSource = this.resolveFallbackSource({
      coreStatus,
      resolvedCustomerId,
    })

    businessTransactionsTotal.inc({
      flow: 'profile_summary',
      outcome: fallbackSource,
    })

    logEvent('profile-summary.fetch.completed', {
      customerId: requestedCustomerId,
      loginId: requestedLoginId,
      resolvedCustomerId,
      source: fallbackSource,
    })

    return {
      ...customerProfileSummaryMock,
      customer: {
        ...customerProfileSummaryMock.customer,
        id: resolvedCustomerId ?? customerProfileSummaryMock.customer.id,
      },
      source: fallbackSource,
      integrations: {
        coreCustomer: coreStatus,
      },
    }
  }

  private async resolveCustomerId(
    customerId?: string,
    loginId?: string,
  ): Promise<string | undefined> {
    if (customerId) {
      return customerId
    }

    if (!loginId) {
      return undefined
    }

    const loginTrace = await this.authAdapter.getLoginByLoginId(loginId)
    return loginTrace?.trace.customerSnapshot.customerId
  }

  private mapCoreProfileSummary(
    profileSummary: CustomerProfileSummaryCoreResponseDto,
    coreStatus: ProfileIntegrationStatus,
  ): ProfileSummaryResponseDto {
    const fullName = `${profileSummary.firstName} ${profileSummary.lastName}`.trim()
    const maskedEmail = this.maskEmailHash(profileSummary.customerEmailHash)

    return {
      customer: {
        id: profileSummary.customerId,
        documentType: customerProfileSummaryMock.customer.documentType,
        documentNumberMasked: customerProfileSummaryMock.customer.documentNumberMasked,
        fullName: fullName || customerProfileSummaryMock.customer.fullName,
        email: maskedEmail,
        phoneMasked: customerProfileSummaryMock.customer.phoneMasked,
      },
      membership: {
        status: profileSummary.enrollmentStatus,
        joinedAt: profileSummary.updatedAt,
        tier: {
          code: profileSummary.loyaltyTier.toLowerCase(),
          name: this.formatTierName(profileSummary.loyaltyTier),
        },
      },
      source: 'core-customer',
      integrations: {
        coreCustomer: coreStatus,
      },
    }
  }

  private formatTierName(tier: string): string {
    const normalized = tier.trim()
    if (!normalized) {
      return customerProfileSummaryMock.membership.tier.name
    }

    return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase()
  }

  private maskEmailHash(emailHash: string): string {
    const normalized = emailHash.trim()
    if (!normalized) {
      return customerProfileSummaryMock.customer.email
    }

    return `${normalized.slice(0, 8)}…`
  }

  private resolveFallbackSource(input: {
    coreStatus: ProfileIntegrationStatus
    resolvedCustomerId?: string
  }): ProfileSummarySource {
    if (!input.resolvedCustomerId) {
      return 'mock_missing_context'
    }

    return input.coreStatus.available ? 'mock_core_unavailable_data' : 'mock_core_unavailable'
  }
}
