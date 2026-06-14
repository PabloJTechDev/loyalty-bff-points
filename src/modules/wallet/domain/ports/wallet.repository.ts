// Domain layer — no NestJS imports allowed

export const WALLET_REPOSITORY = Symbol('IWalletRepository')

// ── Entity types ─────────────────────────────────────────────────────────────

export interface WalletResponseDto {
  summary: {
    availablePoints: number
    pendingPoints: number
    expiringPoints: number
    expiringAt: string
  }
  movements: Array<{
    id: string
    type: string
    category: string
    description: string
    points: number
    balanceAfter: number
    occurredAt: string
  }>
  pagination: {
    page: number
    pageSize: number
    total: number
  }
  source: 'mock' | 'core-customer'
  integrations: {
    coreCustomer: WalletIntegrationStatus
  }
}

export interface PointsBalanceDto {
  customerId: string
  balancePoints: number
  lifetimeAccrued: number
  lifetimeRedeemed: number
  source: string
}

export interface PointsTransactionItemDto {
  transactionId: string
  type: string
  points: number
  referenceId: string
  source: string
  description: string
  createdAt: string
}

export interface PointsTransactionsDto {
  items: PointsTransactionItemDto[]
  total: number
}

export interface WalletIntegrationStatus {
  available: boolean
  baseUrl: string
  checkedAt: string
  reason?: 'healthy' | 'timeout' | 'network_error' | 'http_error' | 'unknown_error'
  statusCode?: number
}

// ── Port interface ────────────────────────────────────────────────────────────

export interface IWalletRepository {
  getWallet(): Promise<WalletResponseDto>
  getPointsBalance(customerId: string): Promise<PointsBalanceDto>
  getPointsTransactions(customerId: string): Promise<PointsTransactionsDto>
}
