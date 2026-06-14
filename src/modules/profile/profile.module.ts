import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { ProfileController } from './presentation/profile.controller'
import { GetHomeUseCase } from './application/get-home.use-case'
import { GetProfileSummaryUseCase } from './application/get-profile-summary.use-case'
import { CoreCustomerProfileAdapter } from './infrastructure/adapters/core-customer-profile.adapter'
import { AuthModule } from '../auth/auth.module'
import { EnrollmentModule } from '../enrollment/enrollment.module'
import { PROFILE_REPOSITORY } from './domain/ports/profile.repository'

@Module({
  imports: [HttpModule, EnrollmentModule, AuthModule],
  controllers: [ProfileController],
  providers: [
    {
      provide: PROFILE_REPOSITORY,
      useClass: CoreCustomerProfileAdapter,
    },
    GetHomeUseCase,
    GetProfileSummaryUseCase,
  ],
})
export class ProfileModule {}
