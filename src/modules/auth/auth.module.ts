import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { AuthController } from './presentation/auth.controller'
import { RegisterPasswordChangeUseCase } from './application/register-password-change.use-case'
import { GetPasswordChangeByIdUseCase } from './application/get-password-change-by-id.use-case'
import { RegisterLoginUseCase } from './application/register-login.use-case'
import { GetLoginByIdUseCase } from './application/get-login-by-id.use-case'
import { CoreCustomerAuthAdapter } from './infrastructure/adapters/core-customer-auth.adapter'
import { CoreCustomerClient } from '../../shared/infrastructure/core-customer.client'
import { EnrollmentModule } from '../enrollment/enrollment.module'
import { AUTH_REPOSITORY } from './domain/ports/auth.repository'

@Module({
  imports: [HttpModule, EnrollmentModule],
  controllers: [AuthController],
  providers: [
    {
      provide: AUTH_REPOSITORY,
      useClass: CoreCustomerAuthAdapter,
    },
    CoreCustomerAuthAdapter,
    RegisterPasswordChangeUseCase,
    GetPasswordChangeByIdUseCase,
    RegisterLoginUseCase,
    GetLoginByIdUseCase,
  ],
  exports: [CoreCustomerAuthAdapter],
})
export class AuthModule {}
