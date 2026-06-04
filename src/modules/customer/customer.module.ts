import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { CoreCustomerClient } from './clients/core-customer.client';
import { CustomerEnrollmentTraceService } from './services/customer-enrollment-trace.service';
import { CustomerPasswordChangeService } from './services/customer-password-change.service';
import { CustomerLoginService } from './services/customer-login.service';
import { CustomerProfileSummaryService } from './services/customer-profile-summary.service';

@Module({
  imports: [HttpModule],
  controllers: [CustomerController],
  providers: [
    CustomerService,
    CoreCustomerClient,
    CustomerEnrollmentTraceService,
    CustomerPasswordChangeService,
    CustomerLoginService,
    CustomerProfileSummaryService,
  ],
  exports: [CustomerService],
})
export class CustomerModule {}
