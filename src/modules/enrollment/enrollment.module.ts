import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { EnrollmentController } from './presentation/enrollment.controller'
import { RegisterEnrollmentUseCase } from './application/register-enrollment.use-case'
import { GetEnrollmentTracesUseCase } from './application/get-enrollment-traces.use-case'
import { GetEnrollmentTraceByIdUseCase } from './application/get-enrollment-trace-by-id.use-case'
import { CoreCustomerEnrollmentAdapter } from './infrastructure/adapters/core-customer-enrollment.adapter'
import { CoreCustomerClient } from '../../shared/infrastructure/core-customer.client'
import { ENROLLMENT_REPOSITORY } from './domain/ports/enrollment.repository'

@Module({
  imports: [HttpModule],
  controllers: [EnrollmentController],
  providers: [
    CoreCustomerClient,
    {
      provide: ENROLLMENT_REPOSITORY,
      useClass: CoreCustomerEnrollmentAdapter,
    },
    CoreCustomerEnrollmentAdapter,
    RegisterEnrollmentUseCase,
    GetEnrollmentTracesUseCase,
    GetEnrollmentTraceByIdUseCase,
  ],
  exports: [CoreCustomerEnrollmentAdapter, CoreCustomerClient],
})
export class EnrollmentModule {}
