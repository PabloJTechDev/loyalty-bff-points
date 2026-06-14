import { Injectable } from '@nestjs/common'
import { CoreCustomerClient } from '../../../../shared/infrastructure/core-customer.client'
import type {
  IWalletRepository,
  WalletResponseDto,
  PointsBalanceDto,
  PointsTransactionsDto,
} from '../../domain/ports/wallet.repository'

const customerWalletMock = {
  summary: {
    availablePoints: 15200,
    pendingPoints: 300,
    expiringPoints: 1200,
    expiringAt: '2026-06-30',
  },
  movements: [
    {
      id: 'mov_001',
      type: 'earn',
      category: 'purchase',
      description: 'Compra en tienda partner',
      points: 450,
      balanceAfter: 15200,
      occurredAt: '2026-05-28T12:30:00Z',
    },
    {
      id: 'mov_002',
      type: 'expire',
      category: 'expiration',
      description: 'Vencimiento mensual',
      points: -120,
      balanceAfter: 14750,
      occurredAt: '2026-05-01T00:00:00Z',
    },
  ],
  pagination: {
    page: 1,
    pageSize: 20,
    total: 138,
  },
}

@Injectable()
export class CoreCustomerWalletAdapter implements IWalletRepository {
  constructor(private readonly coreCustomerClient: CoreCustomerClient) {}

  async getWallet(): Promise<WalletResponseDto> {
    const coreStatus = await this.coreCustomerClient.ping()

    return {
      ...customerWalletMock,
      source: coreStatus.available ? 'core-customer' : 'mock',
      integrations: {
        coreCustomer: coreStatus,
      },
    }
  }

  async getPointsBalance(customerId: string): Promise<PointsBalanceDto> {
    const balance = await this.coreCustomerClient.getPointsBalance(customerId)

    if (!balance) {
      return {
        customerId,
        balancePoints: 0,
        lifetimeAccrued: 0,
        lifetimeRedeemed: 0,
        source: 'not_found',
      }
    }

    return {
      customerId,
      ...balance,
      source: 'core-points',
    }
  }

  async getPointsTransactions(customerId: string): Promise<PointsTransactionsDto> {
    return this.coreCustomerClient.getPointsTransactions(customerId)
  }
}
