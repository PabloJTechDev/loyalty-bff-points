import { Controller, Get, Param } from '@nestjs/common'
import { GetWalletUseCase } from '../application/get-wallet.use-case'
import { GetPointsBalanceUseCase } from '../application/get-points-balance.use-case'
import { GetPointsTransactionsUseCase } from '../application/get-points-transactions.use-case'

@Controller('v1/customer')
export class WalletController {
  constructor(
    private readonly getWallet: GetWalletUseCase,
    private readonly getPointsBalance: GetPointsBalanceUseCase,
    private readonly getPointsTransactions: GetPointsTransactionsUseCase,
  ) {}

  @Get('wallet')
  wallet() {
    return this.getWallet.execute()
  }

  @Get('points/:customerId/balance')
  balance(@Param('customerId') customerId: string) {
    return this.getPointsBalance.execute(customerId)
  }

  @Get('points/:customerId/transactions')
  transactions(@Param('customerId') customerId: string) {
    return this.getPointsTransactions.execute(customerId)
  }
}
