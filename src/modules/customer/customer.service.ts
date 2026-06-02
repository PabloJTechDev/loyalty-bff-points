import { Injectable, NotFoundException } from '@nestjs/common';
import { CoreCustomerClient } from './clients/core-customer.client';
import { CustomerEnrollmentTraceService } from './services/customer-enrollment-trace.service';
import { CustomerPasswordChangeService } from './services/customer-password-change.service';
import { CustomerLoginService } from './services/customer-login.service';
import {
  customerHomeMock,
  customerProfileSummaryMock,
  customerWalletMock,
} from './mocks/customer.mock';
import type { CustomerHomeResponseDto } from './dto/customer-home-response.dto';
import type { CustomerProfileSummaryResponseDto } from './dto/customer-profile-summary-response.dto';
import type { CustomerWalletResponseDto } from './dto/customer-wallet-response.dto';
import type { IntegrationStatusDto } from '../../common/dto/integration-status.dto';
import type { CustomerEnrollmentRequestDto } from './dto/customer-enrollment-request.dto';
import type { CustomerPasswordChangeRequestDto } from './dto/customer-password-change.dto';
import type { CustomerLoginRequestDto } from './dto/customer-login.dto';
import type {
  CustomerEnrollmentReceiptDto,
  CustomerEnrollmentTraceDetailsDto,
  CustomerEnrollmentTraceListResponseDto,
} from './dto/customer-enrollment-trace.dto';
import type {
  CustomerPasswordChangeReceiptDto,
  CustomerPasswordChangeTraceDetailsDto,
} from './dto/customer-password-change.dto';
import type {
  CustomerLoginReceiptDto,
  CustomerLoginTraceDetailsDto,
} from './dto/customer-login.dto';

@Injectable()
export class CustomerService {
  constructor(
    private readonly coreCustomerClient: CoreCustomerClient,
    private readonly customerEnrollmentTraceService: CustomerEnrollmentTraceService,
    private readonly customerPasswordChangeService: CustomerPasswordChangeService,
    private readonly customerLoginService: CustomerLoginService,
  ) {}

  async getHome(): Promise<CustomerHomeResponseDto> {
    const coreStatus = await this.coreCustomerClient.ping();

    return {
      ...customerHomeMock,
      source: this.resolveSource(coreStatus),
      integrations: {
        coreCustomer: coreStatus,
      },
    };
  }

  async getProfileSummary(): Promise<CustomerProfileSummaryResponseDto> {
    const coreStatus = await this.coreCustomerClient.ping();

    return {
      ...customerProfileSummaryMock,
      source: this.resolveSource(coreStatus),
      integrations: {
        coreCustomer: coreStatus,
      },
    };
  }

  async getWallet(): Promise<CustomerWalletResponseDto> {
    const coreStatus = await this.coreCustomerClient.ping();

    return {
      ...customerWalletMock,
      source: this.resolveSource(coreStatus),
      integrations: {
        coreCustomer: coreStatus,
      },
    };
  }

  getEnrollmentTraces(): CustomerEnrollmentTraceListResponseDto {
    return this.customerEnrollmentTraceService.list();
  }

  async getEnrollmentTraceByTransactionId(
    transactionId: string,
  ): Promise<CustomerEnrollmentTraceDetailsDto> {
    const result =
      await this.customerEnrollmentTraceService.getByTransactionId(
        transactionId,
      );

    if (!result) {
      throw new NotFoundException(
        `Enrollment trace not found for transactionId ${transactionId}`,
      );
    }

    return result;
  }

  async registerEnrollment(
    input: CustomerEnrollmentRequestDto,
  ): Promise<CustomerEnrollmentReceiptDto> {
    return this.customerEnrollmentTraceService.register(input);
  }

  async registerPasswordChange(
    input: CustomerPasswordChangeRequestDto,
  ): Promise<CustomerPasswordChangeReceiptDto> {
    return this.customerPasswordChangeService.register(input);
  }

  async getPasswordChangeByRequestId(
    requestId: string,
  ): Promise<CustomerPasswordChangeTraceDetailsDto> {
    const result = await this.customerPasswordChangeService.getByRequestId(
      requestId,
    );

    if (!result) {
      throw new NotFoundException(
        `Password change trace not found for requestId ${requestId}`,
      );
    }

    return result;
  }

  async registerLogin(
    input: CustomerLoginRequestDto,
  ): Promise<CustomerLoginReceiptDto> {
    return this.customerLoginService.register(input);
  }

  async getLoginByLoginId(loginId: string): Promise<CustomerLoginTraceDetailsDto> {
    const result = await this.customerLoginService.getByLoginId(loginId);

    if (!result) {
      throw new NotFoundException(`Login trace not found for loginId ${loginId}`);
    }

    return result;
  }

  async getReadiness() {
    const coreCustomer = await this.coreCustomerClient.ping();

    return {
      status: coreCustomer.available ? 'ready' : 'degraded',
      service: 'bff-customer',
      checkedAt: new Date().toISOString(),
      integrations: {
        coreCustomer,
      },
    };
  }

  private resolveSource(
    coreStatus: IntegrationStatusDto,
  ): 'mock' | 'core-customer' {
    return coreStatus.available ? 'core-customer' : 'mock';
  }
}
