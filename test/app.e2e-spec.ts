import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/api/health (GET)', async () => {
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];

    await request(httpServer)
      .get('/api/health')
      .expect(200)
      .expect({ status: 'ok', service: 'bff-customer' });
  });

  it('/api/v1/customer/home (GET)', async () => {
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];

    const response = await request(httpServer)
      .get('/api/v1/customer/home')
      .expect(200);

    expect(response.body.source).toBeDefined();
    expect(response.body.customer.fullName).toBeTruthy();
    expect(response.body.membership.tier.name).toBeTruthy();
  });
});
