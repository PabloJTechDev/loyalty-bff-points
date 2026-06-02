import { NotFoundException } from '@nestjs/common';
import { CustomerEnrollmentTraceService } from './customer-enrollment-trace.service';
import { CustomerPasswordChangeService } from './customer-password-change.service';
import { CustomerLoginService } from './customer-login.service';

describe('Customer journey services', () => {
  const baseIntegrationStatus = {
    available: true,
    baseUrl: 'http://core-customer.test',
    checkedAt: '2026-06-02T16:00:00.000Z',
    reason: 'healthy',
    statusCode: 200,
  } as const;

  let coreCustomerClient: {
    ping: jest.Mock;
    handoffEnrollment: jest.Mock;
    getEnrollmentByTransactionId: jest.Mock;
    handoffPasswordChange: jest.Mock;
    getPasswordChangeByRequestId: jest.Mock;
    handoffLogin: jest.Mock;
    getLoginByLoginId: jest.Mock;
  };

  let enrollmentService: CustomerEnrollmentTraceService;
  let passwordChangeService: CustomerPasswordChangeService;
  let loginService: CustomerLoginService;

  beforeEach(() => {
    coreCustomerClient = {
      ping: jest.fn().mockResolvedValue(baseIntegrationStatus),
      handoffEnrollment: jest.fn().mockResolvedValue({
        accepted: true,
        statusCode: 201,
      }),
      getEnrollmentByTransactionId: jest.fn().mockResolvedValue(null),
      handoffPasswordChange: jest.fn().mockResolvedValue({
        accepted: true,
        statusCode: 201,
      }),
      getPasswordChangeByRequestId: jest.fn().mockResolvedValue(null),
      handoffLogin: jest.fn().mockResolvedValue({
        accepted: true,
        statusCode: 201,
      }),
      getLoginByLoginId: jest.fn().mockResolvedValue(null),
    };

    enrollmentService = new CustomerEnrollmentTraceService(
      coreCustomerClient as never,
    );
    passwordChangeService = new CustomerPasswordChangeService(
      coreCustomerClient as never,
      enrollmentService,
    );
    loginService = new CustomerLoginService(
      coreCustomerClient as never,
      passwordChangeService,
    );
  });

  it('completes enrollment -> password change -> login reusing the same technical context', async () => {
    const enrollmentReceipt = await enrollmentService.register({
      email: 'Pablo@Example.com ',
    });

    expect(enrollmentReceipt.transactionId).toMatch(/^txn_/);
    expect(enrollmentReceipt.email).toBe('pablo@example.com');
    expect(enrollmentReceipt.handoff.status).toBe('sent_to_core');
    expect(enrollmentReceipt.verification.emailHash).toHaveLength(64);
    expect(coreCustomerClient.handoffEnrollment).toHaveBeenCalledWith({
      transactionId: enrollmentReceipt.transactionId,
      customerEmailHash: enrollmentReceipt.verification.emailHash,
    });

    const passwordChangeReceipt = await passwordChangeService.register({
      transactionId: enrollmentReceipt.transactionId,
    });

    expect(passwordChangeReceipt.requestId).toMatch(/^pwd_/);
    expect(passwordChangeReceipt.transactionId).toBe(
      enrollmentReceipt.transactionId,
    );
    expect(passwordChangeReceipt.payloadPreparedForCore.customerEmailHash).toBe(
      enrollmentReceipt.verification.emailHash,
    );
    expect(passwordChangeReceipt.handoff.status).toBe('sent_to_core');
    expect(passwordChangeReceipt.outcome.accepted).toBe(true);
    expect(coreCustomerClient.handoffPasswordChange).toHaveBeenCalledWith({
      requestId: passwordChangeReceipt.requestId,
      transactionId: enrollmentReceipt.transactionId,
      customerEmailHash: enrollmentReceipt.verification.emailHash,
    });

    const loginReceipt = await loginService.register({
      requestId: passwordChangeReceipt.requestId,
    });

    expect(loginReceipt.loginId).toMatch(/^login_/);
    expect(loginReceipt.requestId).toBe(passwordChangeReceipt.requestId);
    expect(loginReceipt.transactionId).toBe(enrollmentReceipt.transactionId);
    expect(loginReceipt.session.status).toBe('authenticated');
    expect(loginReceipt.payloadPreparedForCore.customerEmailHash).toBe(
      enrollmentReceipt.verification.emailHash,
    );
    expect(loginReceipt.outcome.authenticated).toBe(true);
    expect(loginReceipt.customerSnapshot.customerId).toBe('cust_001');
    expect(loginReceipt.customerSnapshot.fullName).toBe('Pablo Valverde');
    expect(loginReceipt.customerSnapshot.tierName).toBe('Gold');
    expect(loginReceipt.customerSnapshot.maskedEmail).toBe('pa***@example.com');
    expect(coreCustomerClient.handoffLogin).toHaveBeenCalledWith({
      loginId: loginReceipt.loginId,
      requestId: passwordChangeReceipt.requestId,
      transactionId: enrollmentReceipt.transactionId,
      customerEmailHash: enrollmentReceipt.verification.emailHash,
    });
  });

  it('fails password change when enrollment trace does not exist', async () => {
    await expect(
      passwordChangeService.register({ transactionId: 'txn_missing' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('fails login when password change trace does not exist', async () => {
    await expect(
      loginService.register({ requestId: 'pwd_missing' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('returns a degraded enrollment trace when the core is unavailable', async () => {
    coreCustomerClient.ping.mockResolvedValueOnce({
      available: false,
      baseUrl: 'http://core-customer.test',
      checkedAt: '2026-06-02T16:00:00.000Z',
      reason: 'network_error',
    });

    const receipt = await enrollmentService.register({
      email: 'fallback@example.com',
    });

    expect(receipt.handoff.status).toBe('pending_core');
    expect(coreCustomerClient.handoffEnrollment).not.toHaveBeenCalled();
  });
});
