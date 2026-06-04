import { Controller, Get, Header } from '@nestjs/common';
import { AppService } from './app.service';
import { metricsRegistry } from './common/metrics/http-metrics';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }

  @Get('ready')
  getReadiness() {
    return this.appService.getReadiness();
  }

  @Get('metrics')
  @Header('Content-Type', metricsRegistry.contentType)
  async getMetrics() {
    return metricsRegistry.metrics();
  }
}
