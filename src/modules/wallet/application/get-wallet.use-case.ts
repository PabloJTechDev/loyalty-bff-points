import { Inject, Injectable } from '@nestjs/common'
import { WALLET_REPOSITORY } from '../domain/ports/wallet.repository'
import type {
  IWalletRepository,
  WalletResponseDto,
} from '../domain/ports/wallet.repository'

@Injectable()
export class GetWalletUseCase {
  constructor(
    @Inject(WALLET_REPOSITORY) private readonly wallet: IWalletRepository,
  ) {}

  execute(): Promise<WalletResponseDto> {
    return this.wallet.getWallet()
  }
}
