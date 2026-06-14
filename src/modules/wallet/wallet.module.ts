import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { WalletController } from './presentation/wallet.controller'
import { GetWalletUseCase } from './application/get-wallet.use-case'
import { GetPointsBalanceUseCase } from './application/get-points-balance.use-case'
import { GetPointsTransactionsUseCase } from './application/get-points-transactions.use-case'
import { CoreCustomerWalletAdapter } from './infrastructure/adapters/core-customer-wallet.adapter'
import { CoreCustomerClient } from '../../shared/infrastructure/core-customer.client'
import { WALLET_REPOSITORY } from './domain/ports/wallet.repository'

@Module({
  imports: [HttpModule],
  controllers: [WalletController],
  providers: [
    CoreCustomerClient,
    {
      provide: WALLET_REPOSITORY,
      useClass: CoreCustomerWalletAdapter,
    },
    GetWalletUseCase,
    GetPointsBalanceUseCase,
    GetPointsTransactionsUseCase,
  ],
})
export class WalletModule {}
