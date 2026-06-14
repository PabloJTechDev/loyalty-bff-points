import { Injectable } from '@nestjs/common'
import { CoreCustomerClient } from './shared/infrastructure/core-customer.client'

@Injectable()
export class AppService {
  constructor(private readonly coreCustomerClient: CoreCustomerClient) {}

  getHealth() {
    return {
      status: 'ok',
      service: 'bff-customer',
    }
  }

  async getReadiness() {
    const coreCustomer = await this.coreCustomerClient.ping()

    return {
      status: coreCustomer.available ? 'ready' : 'degraded',
      service: 'bff-customer',
      checkedAt: new Date().toISOString(),
      integrations: {
        coreCustomer,
      },
    }
  }
}
