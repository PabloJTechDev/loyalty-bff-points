// Domain layer — no NestJS imports allowed

export const AUTH_REPOSITORY = Symbol('IAuthRepository')

// ── Input types ──────────────────────────────────────────────────────────────

export interface PasswordChangeInput {
  transactionId?: string
}

export interface LoginInput {
  requestId?: string
}

// ── Password Change types ────────────────────────────────────────────────────

export interface PasswordChangeTraceDto {
  requestId: string
  transactionId: string
  createdAt: string
  handoff: {
    status: 'enrollment_not_found' | 'pending_core' | 'sent_to_core' | 'core_rejected' | 'ready_to_send'
    targetBaseUrl: string
    deliveredAt?: string
    responseStatusCode?: number
  }
  payloadPreparedForCore: {
    requestId: string
    transactionId: string
    customerEmailHash: string
  }
}

export interface PasswordChangeReceiptDto extends PasswordChangeTraceDto {
  outcome: {
    accepted: boolean
    nextStep: 'go_to_password_change_tracking' | 'retry_enrollment_lookup'
  }
}

export interface CustomerPasswordChangeCoreRecordDto {
  requestId: string
  transactionId: string
  customerEmailHash: string
  requestedAt: string
  source: string
  stage: string
}

export interface PasswordChangeTraceDetailsDto {
  trace: PasswordChangeTraceDto
  coreRecord: CustomerPasswordChangeCoreRecordDto | null
}

// ── Login types ──────────────────────────────────────────────────────────────

export interface LoginTraceDto {
  loginId: string
  requestId: string
  transactionId: string
  createdAt: string
  session: {
    status: 'password_change_not_found' | 'pending_core' | 'authenticated' | 'core_rejected' | 'ready_to_authenticate'
    targetBaseUrl: string
    authenticatedAt?: string
    responseStatusCode?: number
  }
  customerSnapshot: {
    customerId: string
    fullName: string
    maskedEmail: string
    tierName: string
  }
  payloadPreparedForCore: {
    loginId: string
    requestId: string
    transactionId: string
    customerEmailHash: string
  }
}

export interface LoginReceiptDto extends LoginTraceDto {
  outcome: {
    authenticated: boolean
    nextStep: 'go_to_authenticated_home' | 'retry_password_change_lookup'
  }
}

export interface CustomerLoginCoreRecordDto {
  loginId: string
  requestId: string
  transactionId: string
  customerEmailHash: string
  authenticatedAt: string
  source: string
  stage: string
}

export interface LoginTraceDetailsDto {
  trace: LoginTraceDto
  coreRecord: CustomerLoginCoreRecordDto | null
}

// ── Port interface ────────────────────────────────────────────────────────────

export interface IAuthRepository {
  registerPasswordChange(input: PasswordChangeInput): Promise<PasswordChangeReceiptDto>
  getPasswordChangeByRequestId(requestId: string): Promise<PasswordChangeTraceDetailsDto | null>
  registerLogin(input: LoginInput): Promise<LoginReceiptDto>
  getLoginByLoginId(loginId: string): Promise<LoginTraceDetailsDto | null>
}
