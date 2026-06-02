export interface CustomerLoginRequestDto {
  requestId?: string;
}

export interface CustomerLoginTraceDto {
  loginId: string;
  requestId: string;
  transactionId: string;
  createdAt: string;
  session: {
    status: 'password_change_not_found' | 'pending_core' | 'authenticated' | 'core_rejected' | 'ready_to_authenticate';
    targetBaseUrl: string;
    authenticatedAt?: string;
    responseStatusCode?: number;
  };
  customerSnapshot: {
    customerId: string;
    fullName: string;
    maskedEmail: string;
    tierName: string;
  };
  payloadPreparedForCore: {
    loginId: string;
    requestId: string;
    transactionId: string;
    customerEmailHash: string;
  };
}

export interface CustomerLoginReceiptDto extends CustomerLoginTraceDto {
  outcome: {
    authenticated: boolean;
    nextStep: 'go_to_authenticated_home' | 'retry_password_change_lookup';
  };
}

export interface CustomerLoginCoreRecordDto {
  loginId: string;
  requestId: string;
  transactionId: string;
  customerEmailHash: string;
  authenticatedAt: string;
  source: string;
  stage: string;
}

export interface CustomerLoginTraceDetailsDto {
  trace: CustomerLoginTraceDto;
  coreRecord: CustomerLoginCoreRecordDto | null;
}
