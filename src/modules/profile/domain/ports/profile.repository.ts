// Domain layer — no NestJS imports allowed

export const PROFILE_REPOSITORY = Symbol('IProfileRepository')

// ── Query types ───────────────────────────────────────────────────────────────

export interface ProfileSummaryQuery {
  customerId?: string
  loginId?: string
}

// ── Entity types ─────────────────────────────────────────────────────────────

export type ProfileSummarySource =
  | 'core-customer'
  | 'mock_missing_context'
  | 'mock_core_unavailable'
  | 'mock_core_unavailable_data'

export interface CustomerProfileSummaryCoreResponseDto {
  customerId: string
  customerEmailHash: string
  firstName: string
  lastName: string
  loyaltyTier: string
  enrollmentStatus: string
  enrollmentTransactionId: string
  passwordChangeStatus: string
  passwordChangeRequestId: string
  lastLoginId: string
  lastLoginAt: string
  source: string
  stage: string
  updatedAt: string
}

export interface ProfileIntegrationStatus {
  available: boolean
  baseUrl: string
  checkedAt: string
  reason?: 'healthy' | 'timeout' | 'network_error' | 'http_error' | 'unknown_error'
  statusCode?: number
}

export interface HomeResponseDto {
  customer: {
    id: string
    firstName: string
    fullName: string
  }
  membership: {
    status: string
    tier: {
      code: string
      name: string
    }
  }
  wallet: {
    availablePoints: number
    expiringPoints: number
    expiringAt: string
  }
  tierProgress: {
    current: string
    next: string
    progressPercentage: number
    missingPoints: number
  }
  recentActivity: Array<{
    id: string
    type: string
    description: string
    points: number
    occurredAt: string
  }>
  primaryAction: {
    label: string
    target: string
  }
  source: 'mock' | 'core-customer'
  integrations: {
    coreCustomer: ProfileIntegrationStatus
  }
}

export interface ProfileSummaryResponseDto {
  customer: {
    id: string
    documentType: string
    documentNumberMasked: string
    fullName: string
    email: string
    phoneMasked: string
  }
  membership: {
    status: string
    joinedAt: string
    tier: {
      code: string
      name: string
    }
  }
  source: ProfileSummarySource
  integrations: {
    coreCustomer: ProfileIntegrationStatus
  }
}

// ── Port interface ────────────────────────────────────────────────────────────

export interface IProfileRepository {
  getHome(): Promise<HomeResponseDto>
  getProfileSummary(query: ProfileSummaryQuery): Promise<ProfileSummaryResponseDto>
}
