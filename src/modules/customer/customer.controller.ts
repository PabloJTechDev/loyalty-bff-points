import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CustomerService } from './customer.service';
import type { CustomerHomeResponseDto } from './dto/customer-home-response.dto';
import type { CustomerProfileSummaryResponseDto } from './dto/customer-profile-summary-response.dto';
import type { CustomerWalletResponseDto } from './dto/customer-wallet-response.dto';
import type { CustomerEnrollmentRequestDto } from './dto/customer-enrollment-request.dto';
import type {
  CustomerEnrollmentReceiptDto,
  CustomerEnrollmentTraceDetailsDto,
  CustomerEnrollmentTraceListResponseDto,
} from './dto/customer-enrollment-trace.dto';
import type {
  CustomerPasswordChangeReceiptDto,
  CustomerPasswordChangeTraceDetailsDto,
  CustomerPasswordChangeRequestDto,
} from './dto/customer-password-change.dto';
import type {
  CustomerLoginReceiptDto,
  CustomerLoginTraceDetailsDto,
  CustomerLoginRequestDto,
} from './dto/customer-login.dto';

@Controller('v1/customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get('home')
  getHome(): Promise<CustomerHomeResponseDto> {
    return this.customerService.getHome();
  }

  @Get('profile-summary')
  getProfileSummary(): Promise<CustomerProfileSummaryResponseDto> {
    return this.customerService.getProfileSummary();
  }

  @Get('wallet')
  getWallet(): Promise<CustomerWalletResponseDto> {
    return this.customerService.getWallet();
  }

  @Get('enrollment-traces')
  getEnrollmentTraces(): CustomerEnrollmentTraceListResponseDto {
    return this.customerService.getEnrollmentTraces();
  }

  @Get('enrollment-traces/:transactionId')
  getEnrollmentTraceByTransactionId(
    @Param('transactionId') transactionId: string,
  ): Promise<CustomerEnrollmentTraceDetailsDto> {
    return this.customerService.getEnrollmentTraceByTransactionId(
      transactionId,
    );
  }

  @Post('enrollment')
  registerEnrollment(
    @Body() body: CustomerEnrollmentRequestDto,
  ): Promise<CustomerEnrollmentReceiptDto> {
    return this.customerService.registerEnrollment(body);
  }

  @Post('password-change')
  registerPasswordChange(
    @Body() body: CustomerPasswordChangeRequestDto,
  ): Promise<CustomerPasswordChangeReceiptDto> {
    return this.customerService.registerPasswordChange(body);
  }

  @Get('password-change-traces/:requestId')
  getPasswordChangeByRequestId(
    @Param('requestId') requestId: string,
  ): Promise<CustomerPasswordChangeTraceDetailsDto> {
    return this.customerService.getPasswordChangeByRequestId(requestId);
  }

  @Post('login')
  registerLogin(
    @Body() body: CustomerLoginRequestDto,
  ): Promise<CustomerLoginReceiptDto> {
    return this.customerService.registerLogin(body);
  }

  @Get('login-traces/:loginId')
  getLoginByLoginId(
    @Param('loginId') loginId: string,
  ): Promise<CustomerLoginTraceDetailsDto> {
    return this.customerService.getLoginByLoginId(loginId);
  }
}
