// Domain layer — no NestJS imports allowed

export const ENROLLMENT_REPOSITORY = Symbol('IEnrollmentRepository')

// ── Input types ──────────────────────────────────────────────────────────────

export interface EnrollmentInput {
  email?: string
  password?: string
  confirmPassword?: string
}

// ── Entity / trace types ─────────────────────────────────────────────────────

export interface EnrollmentTraceDto {
  transactionId: string
  email: string
  createdAt: string
  handoff: {
    status: 'pending_core' | 'sent_to_core' | 'core_rejected' | 'ready_to_send'
    targetBaseUrl: string
    deliveredAt?: string
    responseStatusCode?: number
  }
  payloadPreparedForCore: {
    transactionId: string
    customerEmailHash: string
  }
  integrations: {
    coreCustomer: IntegrationStatus
  }
}

export interface EnrollmentReceiptDto extends EnrollmentTraceDto {
  verification: {
    emailHash: string
    shownOnce: true
  }
  passwordSetup?: {
    requestId: string
    accepted: boolean
    nextStep: 'go_to_login' | 'retry_password_setup'
  }
}

export interface EnrollmentTraceListResponseDto {
  defaultEmail: string
  total: number
  items: EnrollmentTraceDto[]
}

export interface CustomerEnrollmentCoreRecordDto {
  transactionId: string
  customerEmailHash: string
  receivedAt: string
  source: string
  stage: string
}

export interface EnrollmentTraceDetailsDto {
  trace: EnrollmentTraceDto
  coreRecord: CustomerEnrollmentCoreRecordDto | null
}

// ── Shared status (kept minimal — avoid cross-module coupling) ────────────────

export interface IntegrationStatus {
  available: boolean
  baseUrl: string
  checkedAt: string
  reason?: 'healthy' | 'timeout' | 'network_error' | 'http_error' | 'unknown_error'
  statusCode?: number
}

// ── Port interface ────────────────────────────────────────────────────────────

export interface IEnrollmentRepository {
  register(input: EnrollmentInput): Promise<EnrollmentReceiptDto>
  list(): EnrollmentTraceListResponseDto
  getByTransactionId(transactionId: string): Promise<EnrollmentTraceDetailsDto | null>
}
