import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { HttpModule } from '@nestjs/axios'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { HttpMetricsMiddleware } from './shared/metrics/http-metrics.middleware'
import { CoreCustomerClient } from './shared/infrastructure/core-customer.client'
import { EnrollmentModule } from './modules/enrollment/enrollment.module'
import { AuthModule } from './modules/auth/auth.module'
import { WalletModule } from './modules/wallet/wallet.module'
import { ProfileModule } from './modules/profile/profile.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    HttpModule,
    EnrollmentModule,
    AuthModule,
    WalletModule,
    ProfileModule,
  ],
  controllers: [AppController],
  providers: [AppService, CoreCustomerClient],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpMetricsMiddleware).forRoutes('*path')
  }
}
