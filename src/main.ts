import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { logEvent } from './shared/logging/json-log'

async function bootstrap() {
  const port = Number(process.env.PORT ?? 3002)
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'],
  })

  app.setGlobalPrefix('api')
  await app.listen(port)

  logEvent('service.started', {
    port,
    basePath: '/api',
  })
}

void bootstrap()
