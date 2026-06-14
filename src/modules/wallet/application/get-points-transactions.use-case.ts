import { Inject, Injectable } from '@nestjs/common'
import { WALLET_REPOSITORY } from '../domain/ports/wallet.repository'
import type {
  IWalletRepository,
  PointsTransactionsDto,
} from '../domain/ports/wallet.repository'

@Injectable()
export class GetPointsTransactionsUseCase {
  constructor(
    @Inject(WALLET_REPOSITORY) private readonly wallet: IWalletRepository,
  ) {}

  execute(customerId: string): Promise<PointsTransactionsDto> {
    return this.wallet.getPointsTransactions(customerId)
  }
}
