import { Inject, Injectable } from '@nestjs/common'
import { WALLET_REPOSITORY } from '../domain/ports/wallet.repository'
import type {
  IWalletRepository,
  PointsBalanceDto,
} from '../domain/ports/wallet.repository'

@Injectable()
export class GetPointsBalanceUseCase {
  constructor(
    @Inject(WALLET_REPOSITORY) private readonly wallet: IWalletRepository,
  ) {}

  execute(customerId: string): Promise<PointsBalanceDto> {
    return this.wallet.getPointsBalance(customerId)
  }
}
