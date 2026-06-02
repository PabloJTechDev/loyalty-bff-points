import type { IntegrationStatusDto } from '../../../common/dto/integration-status.dto';

export interface CustomerEnrollmentTraceDto {
  transactionId: string;
  email: string;
  createdAt: string;
  handoff: {
    status: 'pending_core' | 'sent_to_core' | 'core_rejected' | 'ready_to_send';
    targetBaseUrl: string;
    deliveredAt?: string;
    responseStatusCode?: number;
  };
  payloadPreparedForCore: {
    transactionId: string;
    customerEmailHash: string;
  };
  integrations: {
    coreCustomer: IntegrationStatusDto;
  };
}

export interface CustomerEnrollmentReceiptDto extends CustomerEnrollmentTraceDto {
  verification: {
    emailHash: string;
    shownOnce: true;
  };
}

export interface CustomerEnrollmentTraceListResponseDto {
  defaultEmail: string;
  total: number;
  items: CustomerEnrollmentTraceDto[];
}

export interface CustomerEnrollmentCoreRecordDto {
  transactionId: string;
  customerEmailHash: string;
  receivedAt: string;
  source: string;
  stage: string;
}

export interface CustomerEnrollmentTraceDetailsDto {
  trace: CustomerEnrollmentTraceDto;
  coreRecord: CustomerEnrollmentCoreRecordDto | null;
}
