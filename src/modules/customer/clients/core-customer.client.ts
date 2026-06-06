import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import type { IntegrationStatusDto } from '../../../common/dto/integration-status.dto';
import type { CustomerEnrollmentCoreRecordDto } from '../dto/customer-enrollment-trace.dto';
import type { CustomerPasswordChangeCoreRecordDto } from '../dto/customer-password-change.dto';
import type { CustomerLoginCoreRecordDto } from '../dto/customer-login.dto';
import type { CustomerProfileSummaryCoreResponseDto } from '../dto/customer-profile-summary-response.dto';

interface EnrollmentPayload {
  transactionId: string;
  customerEmailHash: string;
}

interface PasswordChangePayload {
  requestId: string;
  transactionId: string;
  customerEmailHash: string;
}

interface LoginPayload {
  loginId: string;
  requestId: string;
  transactionId: string;
  customerEmailHash: string;
}

@Injectable()
export class CoreCustomerClient {
  private readonly logger = new Logger(CoreCustomerClient.name);
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl =
      this.configService.get<string>('CORE_POINTS_BASE_URL') ??
      'http://localhost:3001';
  }

  getBaseUrl() {
    return this.baseUrl;
  }

  async ping(): Promise<IntegrationStatusDto> {
    const checkedAt = new Date().toISOString();

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/health`, {
          timeout: 1500,
        }),
      );

      return {
        available: true,
        baseUrl: this.baseUrl,
        checkedAt,
        reason: 'healthy',
        statusCode: response.status,
      };
    } catch (error) {
      const status = this.mapErrorToStatus(error, checkedAt);
      this.logger.debug(
        `Core customer unavailable at ${this.baseUrl} (${status.reason}${status.statusCode ? `:${status.statusCode}` : ''})`,
      );
      return status;
    }
  }

  async handoffEnrollment(
    payload: EnrollmentPayload,
  ): Promise<{ accepted: boolean; statusCode?: number }> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/v1/customer-enrollments`,
          payload,
          {
            timeout: 1500,
          },
        ),
      );

      return {
        accepted: response.status >= 200 && response.status < 300,
        statusCode: response.status,
      };
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        return {
          accepted: false,
          statusCode: error.response.status,
        };
      }

      return {
        accepted: false,
      };
    }
  }

  async getEnrollmentByTransactionId(
    transactionId: string,
  ): Promise<CustomerEnrollmentCoreRecordDto | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/v1/customer-enrollments/${encodeURIComponent(transactionId)}`,
          {
            timeout: 1500,
          },
        ),
      );

      return response.data as CustomerEnrollmentCoreRecordDto;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        return null;
      }

      return null;
    }
  }

  async handoffPasswordChange(
    payload: PasswordChangePayload,
  ): Promise<{ accepted: boolean; statusCode?: number }> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/v1/customer-password-changes`,
          payload,
          {
            timeout: 1500,
          },
        ),
      );

      return {
        accepted: response.status >= 200 && response.status < 300,
        statusCode: response.status,
      };
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        return {
          accepted: false,
          statusCode: error.response.status,
        };
      }

      return {
        accepted: false,
      };
    }
  }

  async getPasswordChangeByRequestId(
    requestId: string,
  ): Promise<CustomerPasswordChangeCoreRecordDto | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/v1/customer-password-changes/${encodeURIComponent(requestId)}`,
          {
            timeout: 1500,
          },
        ),
      );

      return response.data as CustomerPasswordChangeCoreRecordDto;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        return null;
      }

      return null;
    }
  }

  async handoffLogin(
    payload: LoginPayload,
  ): Promise<{ accepted: boolean; statusCode?: number }> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/v1/customer-logins`, payload, {
          timeout: 1500,
        }),
      );

      return {
        accepted: response.status >= 200 && response.status < 300,
        statusCode: response.status,
      };
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        return {
          accepted: false,
          statusCode: error.response.status,
        };
      }

      return {
        accepted: false,
      };
    }
  }

  async getLoginByLoginId(
    loginId: string,
  ): Promise<CustomerLoginCoreRecordDto | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/v1/customer-logins/${encodeURIComponent(loginId)}`,
          {
            timeout: 1500,
          },
        ),
      );

      return response.data as CustomerLoginCoreRecordDto;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        return null;
      }

      return null;
    }
  }

  async getProfileSummaryByCustomerId(
    customerId: string,
  ): Promise<CustomerProfileSummaryCoreResponseDto | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/v1/customers/${encodeURIComponent(customerId)}/profile-summary`,
          {
            timeout: 1500,
          },
        ),
      );

      return response.data as CustomerProfileSummaryCoreResponseDto;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        return null;
      }

      return null;
    }
  }

  async getPointsBalance(customerId: string): Promise<{ balancePoints: number; lifetimeAccrued: number; lifetimeRedeemed: number; updatedAt: string } | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/v1/points/${encodeURIComponent(customerId)}/balance`, { timeout: 1500 }),
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 404) return null;
      return null;
    }
  }

  async getPointsTransactions(customerId: string): Promise<{ items: Array<{ transactionId: string; type: string; points: number; referenceId: string; source: string; description: string; createdAt: string }>; total: number }> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/v1/points/${encodeURIComponent(customerId)}/transactions`, { timeout: 1500 }),
      );
      return response.data;
    } catch {
      return { items: [], total: 0 };
    }
  }

  private mapErrorToStatus(
    error: unknown,
    checkedAt: string,
  ): IntegrationStatusDto {
    if (error instanceof AxiosError) {
      if (error.response) {
        return {
          available: false,
          baseUrl: this.baseUrl,
          checkedAt,
          reason: 'http_error',
          statusCode: error.response.status,
        };
      }

      if (error.code === 'ECONNABORTED') {
        return {
          available: false,
          baseUrl: this.baseUrl,
          checkedAt,
          reason: 'timeout',
        };
      }

      return {
        available: false,
        baseUrl: this.baseUrl,
        checkedAt,
        reason: 'network_error',
      };
    }

    return {
      available: false,
      baseUrl: this.baseUrl,
      checkedAt,
      reason: 'unknown_error',
    };
  }
}
