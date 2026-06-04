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

  it('/api/v1/storefront/home (GET)', async () => {
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];

    const response = await request(httpServer)
      .get('/api/v1/storefront/home')
      .expect(200);

    expect(response.body.source).toBe('mock');
    expect(response.body.hero.title).toContain('Storefront');
    expect(Array.isArray(response.body.featuredProducts)).toBe(true);
    expect(response.body.featuredProducts.length).toBeGreaterThan(0);
  });

  it('/api/v1/storefront/products?categoryId=electronics (GET)', async () => {
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];

    const response = await request(httpServer)
      .get('/api/v1/storefront/products')
      .query({ categoryId: 'electronics' })
      .expect(200);

    expect(response.body.source).toBe('mock');
    expect(response.body.total).toBe(1);
    expect(response.body.items[0]).toMatchObject({
      categoryId: 'electronics',
    });
  });

  it('/api/v1/storefront/products/:productId (GET)', async () => {
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];

    const response = await request(httpServer)
      .get('/api/v1/storefront/products/prod_headphones')
      .expect(200);

    expect(response.body.source).toBe('mock');
    expect(response.body.item).toMatchObject({
      id: 'prod_headphones',
      redemption: {
        minRedeemPoints: 500,
        redemptionRate: '100 pts = USD 1',
        maxRedeemablePercent: 30,
      },
    });
  });

  it('/api/v1/storefront/cart/quote (POST)', async () => {
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];

    const response = await request(httpServer)
      .post('/api/v1/storefront/cart/quote')
      .send({
        items: [
          { productId: 'prod_headphones', quantity: 1 },
          { productId: 'prod_backpack', quantity: 2 },
        ],
      })
      .expect(201);

    expect(response.body).toMatchObject({
      currency: 'USD',
      itemCount: 3,
      subtotalUsd: 247,
      maxRedeemableUsd: 74.1,
      maxRedeemablePoints: 7410,
      payableUsdAfterMaxRedemption: 172.9,
      source: 'mock',
      redemption: {
        minRedeemPoints: 500,
        minRedeemableUsd: 5,
        redemptionRate: '100 pts = USD 1',
        maxRedeemablePercent: 30,
        redemptionAvailable: true,
      },
    });
  });

  it('/api/v1/storefront/redemptions/reserve (POST)', async () => {
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];

    const response = await request(httpServer)
      .post('/api/v1/storefront/redemptions/reserve')
      .send({
        items: [{ productId: 'prod_headphones', quantity: 1 }],
        requestedPoints: 2000,
        availablePoints: 15200,
      })
      .expect(201);

    expect(response.body).toMatchObject({
      source: 'mock',
      status: 'reserved',
      currency: 'USD',
      requestedPoints: 2000,
      reservedPoints: 2000,
      coveredUsd: 20,
      payableUsd: 109,
      rulesApplied: {
        minRedeemPoints: 500,
        redemptionRate: '100 pts = USD 1',
        maxRedeemablePercent: 30,
        availablePoints: 15200,
        maxAllowedPoints: 3870,
      },
    });
    expect(response.body.reservationId).toMatch(/^rsv_/);
    expect(response.body.expiresAt).toBeTruthy();
  });

  it('supports reserve -> confirm lifecycle', async () => {
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];

    const reservation = await request(httpServer)
      .post('/api/v1/storefront/redemptions/reserve')
      .send({
        items: [{ productId: 'prod_headphones', quantity: 1 }],
        requestedPoints: 2000,
        availablePoints: 15200,
      })
      .expect(201);

    const confirmResponse = await request(httpServer)
      .post(
        `/api/v1/storefront/redemptions/reservations/${reservation.body.reservationId}/confirm`,
      )
      .expect(201);

    expect(confirmResponse.body).toMatchObject({
      source: 'mock',
      reservationId: reservation.body.reservationId,
      status: 'confirmed',
      currency: 'USD',
      requestedPoints: 2000,
      reservedPoints: 2000,
      coveredUsd: 20,
      payableUsd: 109,
    });
    expect(confirmResponse.body.expiresAt).toBeUndefined();
  });

  it('supports reserve -> cancel lifecycle', async () => {
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];

    const reservation = await request(httpServer)
      .post('/api/v1/storefront/redemptions/reserve')
      .send({
        items: [{ productId: 'prod_headphones', quantity: 1 }],
        requestedPoints: 1500,
        availablePoints: 15200,
      })
      .expect(201);

    const cancelResponse = await request(httpServer)
      .post(
        `/api/v1/storefront/redemptions/reservations/${reservation.body.reservationId}/cancel`,
      )
      .expect(201);

    expect(cancelResponse.body).toMatchObject({
      source: 'mock',
      reservationId: reservation.body.reservationId,
      status: 'cancelled',
      currency: 'USD',
      requestedPoints: 1500,
      reservedPoints: 1500,
      coveredUsd: 15,
      payableUsd: 114,
    });
    expect(cancelResponse.body.expiresAt).toBeUndefined();
  });

  it('prevents double transitions for reservations', async () => {
    const httpServer = app.getHttpServer() as Parameters<typeof request>[0];

    const reservation = await request(httpServer)
      .post('/api/v1/storefront/redemptions/reserve')
      .send({
        items: [{ productId: 'prod_headphones', quantity: 1 }],
        requestedPoints: 2000,
        availablePoints: 15200,
      })
      .expect(201);

    await request(httpServer)
      .post(
        `/api/v1/storefront/redemptions/reservations/${reservation.body.reservationId}/confirm`,
      )
      .expect(201);

    const invalidTransition = await request(httpServer)
      .post(
        `/api/v1/storefront/redemptions/reservations/${reservation.body.reservationId}/cancel`,
      )
      .expect(400);

    expect(invalidTransition.body.message).toContain('cannot be cancelled');
  });
});
