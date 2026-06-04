import { StorefrontController } from './storefront.controller';
import { StorefrontService } from './storefront.service';

describe('StorefrontController', () => {
  let storefrontController: StorefrontController;

  beforeEach(() => {
    const storefrontService = {
      getHome: jest.fn().mockReturnValue({ source: 'mock' }),
      getCategories: jest.fn().mockReturnValue({ total: 3, items: [], source: 'mock' }),
      getProducts: jest
        .fn()
        .mockImplementation((query?: { categoryId?: string }) => ({
          total: query?.categoryId ? 1 : 3,
          items: [],
          source: 'mock',
        })),
      getProductDetail: jest.fn().mockImplementation((productId: string) => ({
        item: { id: productId },
        source: 'mock',
      })),
      getCartQuote: jest.fn().mockImplementation((payload: { items: unknown[] }) => ({
        currency: 'USD',
        items: payload.items,
        source: 'mock',
      })),
      reserve: jest
        .fn()
        .mockImplementation((payload: { items: unknown[]; requestedPoints?: number }) => ({
          source: 'mock',
          status: 'reserved',
          reservationId: 'rsv_test',
          expiresAt: '2026-06-04T18:15:00.000Z',
          currency: 'USD',
          requestedPoints: payload.requestedPoints ?? 0,
          reservedPoints: payload.requestedPoints ?? 0,
          coveredUsd: 20,
          payableUsd: 109,
          message: 'mock reserve',
          rulesApplied: {
            minRedeemPoints: 500,
            redemptionRate: '100 pts = USD 1',
            maxRedeemablePercent: 30,
            availablePoints: 15200,
            maxAllowedPoints: 3870,
          },
        })),
      confirmReservation: jest.fn().mockImplementation((reservationId: string) => ({
        source: 'mock',
        reservationId,
        status: 'confirmed',
        currency: 'USD',
        requestedPoints: 2000,
        reservedPoints: 2000,
        coveredUsd: 20,
        payableUsd: 109,
        message: 'mock confirm',
        rulesApplied: {
          minRedeemPoints: 500,
          redemptionRate: '100 pts = USD 1',
          maxRedeemablePercent: 30,
          availablePoints: 15200,
          maxAllowedPoints: 3870,
        },
      })),
      cancelReservation: jest.fn().mockImplementation((reservationId: string) => ({
        source: 'mock',
        reservationId,
        status: 'cancelled',
        currency: 'USD',
        requestedPoints: 2000,
        reservedPoints: 2000,
        coveredUsd: 20,
        payableUsd: 109,
        message: 'mock cancel',
        rulesApplied: {
          minRedeemPoints: 500,
          redemptionRate: '100 pts = USD 1',
          maxRedeemablePercent: 30,
          availablePoints: 15200,
          maxAllowedPoints: 3870,
        },
      })),
    } as unknown as StorefrontService;

    storefrontController = new StorefrontController(storefrontService);
  });

  it('returns storefront home payload', () => {
    expect(storefrontController.getHome()).toEqual({ source: 'mock' });
  });

  it('returns storefront categories payload', () => {
    expect(storefrontController.getCategories()).toEqual({
      total: 3,
      items: [],
      source: 'mock',
    });
  });

  it('returns storefront products payload with optional category filter', () => {
    expect(storefrontController.getProducts({ categoryId: 'electronics' })).toEqual({
      total: 1,
      items: [],
      source: 'mock',
    });
  });

  it('returns storefront product detail payload', () => {
    expect(storefrontController.getProductDetail('prod_headphones')).toEqual({
      item: { id: 'prod_headphones' },
      source: 'mock',
    });
  });

  it('returns storefront cart quote payload', () => {
    expect(
      storefrontController.getCartQuote({
        items: [{ productId: 'prod_headphones', quantity: 1 }],
      }),
    ).toEqual({
      currency: 'USD',
      items: [{ productId: 'prod_headphones', quantity: 1 }],
      source: 'mock',
    });
  });

  it('returns storefront reserve payload', () => {
    expect(
      storefrontController.reserve({
        items: [{ productId: 'prod_headphones', quantity: 1 }],
        requestedPoints: 2000,
      }),
    ).toEqual({
      source: 'mock',
      status: 'reserved',
      reservationId: 'rsv_test',
      expiresAt: '2026-06-04T18:15:00.000Z',
      currency: 'USD',
      requestedPoints: 2000,
      reservedPoints: 2000,
      coveredUsd: 20,
      payableUsd: 109,
      message: 'mock reserve',
      rulesApplied: {
        minRedeemPoints: 500,
        redemptionRate: '100 pts = USD 1',
        maxRedeemablePercent: 30,
        availablePoints: 15200,
        maxAllowedPoints: 3870,
      },
    });
  });

  it('returns storefront confirm payload', () => {
    expect(storefrontController.confirmReservation('rsv_test')).toEqual({
      source: 'mock',
      reservationId: 'rsv_test',
      status: 'confirmed',
      currency: 'USD',
      requestedPoints: 2000,
      reservedPoints: 2000,
      coveredUsd: 20,
      payableUsd: 109,
      message: 'mock confirm',
      rulesApplied: {
        minRedeemPoints: 500,
        redemptionRate: '100 pts = USD 1',
        maxRedeemablePercent: 30,
        availablePoints: 15200,
        maxAllowedPoints: 3870,
      },
    });
  });

  it('returns storefront cancel payload', () => {
    expect(storefrontController.cancelReservation('rsv_test')).toEqual({
      source: 'mock',
      reservationId: 'rsv_test',
      status: 'cancelled',
      currency: 'USD',
      requestedPoints: 2000,
      reservedPoints: 2000,
      coveredUsd: 20,
      payableUsd: 109,
      message: 'mock cancel',
      rulesApplied: {
        minRedeemPoints: 500,
        redemptionRate: '100 pts = USD 1',
        maxRedeemablePercent: 30,
        availablePoints: 15200,
        maxAllowedPoints: 3870,
      },
    });
  });
});
