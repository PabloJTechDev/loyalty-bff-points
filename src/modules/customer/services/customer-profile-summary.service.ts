import { Injectable } from '@nestjs/common';
import { logEvent } from '../../../common/logging/json-log';
import { businessTransactionsTotal } from '../../../common/metrics/http-metrics';
import { CoreCustomerClient } from '../clients/core-customer.client';
import { customerProfileSummaryMock } from '../mocks/customer.mock';
import { CustomerLoginService } from './customer-login.service';
import type { IntegrationStatusDto } from '../../../common/dto/integration-status.dto';
import type { CustomerProfileSummaryQueryDto } from '../dto/customer-profile-summary-query.dto';
import type {
  CustomerProfileSummaryCoreResponseDto,
  CustomerProfileSummaryResponseDto,
  CustomerProfileSummarySourceDto,
} from '../dto/customer-profile-summary-response.dto';

@Injectable()
export class CustomerProfileSummaryService {
  constructor(
    private readonly coreCustomerClient: CoreCustomerClient,
    private readonly customerLoginService: CustomerLoginService,
  ) {}

  async getProfileSummary(
    query: CustomerProfileSummaryQueryDto = {},
  ): Promise<CustomerProfileSummaryResponseDto> {
    const requestedCustomerId = query.customerId?.trim();
    const requestedLoginId = query.loginId?.trim();
    const coreStatus = await this.coreCustomerClient.ping();
    const resolvedCustomerId = await this.resolveCustomerId(
      requestedCustomerId,
      requestedLoginId,
    );

    logEvent('profile-summary.fetch.started', {
      customerId: requestedCustomerId,
      loginId: requestedLoginId,
      resolvedCustomerId,
      coreAvailable: coreStatus.available,
    });

    if (coreStatus.available && resolvedCustomerId) {
      const coreProfileSummary =
        await this.coreCustomerClient.getProfileSummaryByCustomerId(
          resolvedCustomerId,
        );

      if (coreProfileSummary) {
        businessTransactionsTotal.inc({
          flow: 'profile_summary',
          outcome: 'served_from_core',
        });

        logEvent('profile-summary.fetch.completed', {
          customerId: requestedCustomerId,
          loginId: requestedLoginId,
          resolvedCustomerId,
          source: 'core-customer',
        });

        return this.mapCoreProfileSummary(coreProfileSummary, coreStatus);
      }
    }

    const fallbackSource = this.resolveFallbackSource({
      coreStatus,
      resolvedCustomerId,
    });

    businessTransactionsTotal.inc({
      flow: 'profile_summary',
      outcome: fallbackSource,
    });

    logEvent('profile-summary.fetch.completed', {
      customerId: requestedCustomerId,
      loginId: requestedLoginId,
      resolvedCustomerId,
      source: fallbackSource,
    });

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
    };
  }

  private async resolveCustomerId(
    customerId?: string,
    loginId?: string,
  ): Promise<string | undefined> {
    if (customerId) {
      return customerId;
    }

    if (!loginId) {
      return undefined;
    }

    const loginTrace = await this.customerLoginService.getByLoginId(loginId);
    return loginTrace?.trace.customerSnapshot.customerId;
  }

  private mapCoreProfileSummary(
    profileSummary: CustomerProfileSummaryCoreResponseDto,
    coreStatus: IntegrationStatusDto,
  ): CustomerProfileSummaryResponseDto {
    const fullName = `${profileSummary.firstName} ${profileSummary.lastName}`.trim();
    const maskedEmail = this.maskEmailHash(profileSummary.customerEmailHash);

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
    };
  }

  private formatTierName(tier: string): string {
    const normalized = tier.trim();
    if (!normalized) {
      return customerProfileSummaryMock.membership.tier.name;
    }

    return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
  }

  private maskEmailHash(emailHash: string): string {
    const normalized = emailHash.trim();
    if (!normalized) {
      return customerProfileSummaryMock.customer.email;
    }

    return `${normalized.slice(0, 8)}…`;
  }

  private resolveFallbackSource(input: {
    coreStatus: IntegrationStatusDto;
    resolvedCustomerId?: string;
  }): CustomerProfileSummarySourceDto {
    if (!input.resolvedCustomerId) {
      return 'mock_missing_context';
    }

    return input.coreStatus.available ? 'mock_core_unavailable_data' : 'mock_core_unavailable';
  }
}
