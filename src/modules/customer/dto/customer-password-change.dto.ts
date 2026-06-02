export interface CustomerPasswordChangeRequestDto {
  transactionId?: string;
}

export interface CustomerPasswordChangeTraceDto {
  requestId: string;
  transactionId: string;
  createdAt: string;
  handoff: {
    status: 'enrollment_not_found' | 'pending_core' | 'sent_to_core' | 'core_rejected' | 'ready_to_send';
    targetBaseUrl: string;
    deliveredAt?: string;
    responseStatusCode?: number;
  };
  payloadPreparedForCore: {
    requestId: string;
    transactionId: string;
    customerEmailHash: string;
  };
}

export interface CustomerPasswordChangeReceiptDto extends CustomerPasswordChangeTraceDto {
  outcome: {
    accepted: boolean;
    nextStep: 'go_to_password_change_tracking' | 'retry_enrollment_lookup';
  };
}

export interface CustomerPasswordChangeCoreRecordDto {
  requestId: string;
  transactionId: string;
  customerEmailHash: string;
  requestedAt: string;
  source: string;
  stage: string;
}

export interface CustomerPasswordChangeTraceDetailsDto {
  trace: CustomerPasswordChangeTraceDto;
  coreRecord: CustomerPasswordChangeCoreRecordDto | null;
}
