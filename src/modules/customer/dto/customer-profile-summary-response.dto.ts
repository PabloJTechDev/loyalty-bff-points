import type { IntegrationStatusDto } from '../../../common/dto/integration-status.dto';

export type CustomerProfileSummarySourceDto =
  | 'core-customer'
  | 'mock_missing_context'
  | 'mock_core_unavailable'
  | 'mock_core_unavailable_data';

export interface CustomerProfileSummaryCoreResponseDto {
  customerId: string;
  customerEmailHash: string;
  firstName: string;
  lastName: string;
  loyaltyTier: string;
  enrollmentStatus: string;
  enrollmentTransactionId: string;
  passwordChangeStatus: string;
  passwordChangeRequestId: string;
  lastLoginId: string;
  lastLoginAt: string;
  source: string;
  stage: string;
  updatedAt: string;
}

export interface CustomerProfileSummaryResponseDto {
  customer: {
    id: string;
    documentType: string;
    documentNumberMasked: string;
    fullName: string;
    email: string;
    phoneMasked: string;
  };
  membership: {
    status: string;
    joinedAt: string;
    tier: {
      code: string;
      name: string;
    };
  };
  source: CustomerProfileSummarySourceDto;
  integrations: {
    coreCustomer: IntegrationStatusDto;
  };
}
