import { BadRequestException, NotFoundException } from '@nestjs/common';
import { StorefrontService } from './storefront.service';

describe('StorefrontService', () => {
  let service: StorefrontService;

  beforeEach(() => {
    service = new StorefrontService();
  });

  it('returns product detail for an existing product', () => {
    const response = service.getProductDetail('prod_headphones');

    expect(response.source).toBe('mock');
    expect(response.item).toMatchObject({
      id: 'prod_headphones',
      redemption: {
        minRedeemPoints: 500,
        redemptionRate: '100 pts = USD 1',
        maxRedeemablePercent: 30,
      },
    });
  });

  it('throws not found for an unknown product detail', () => {
    expect(() => service.getProductDetail('missing')).toThrow(NotFoundException);
  });

  it('calculates quote for a single item and enables redemption above threshold', () => {
    const response = service.getCartQuote({
      items: [{ productId: 'prod_headphones', quantity: 1 }],
    });

    expect(response).toMatchObject({
      currency: 'USD',
      itemCount: 1,
      subtotalUsd: 129,
      maxRedeemableUsd: 38.7,
      maxRedeemablePoints: 3870,
      payableUsdAfterMaxRedemption: 90.3,
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

  it('calculates quote for multiple items with coherent subtotal aggregation', () => {
    const response = service.getCartQuote({
      items: [
        { productId: 'prod_headphones', quantity: 1 },
        { productId: 'prod_backpack', quantity: 2 },
      ],
    });

    expect(response).toMatchObject({
      itemCount: 3,
      subtotalUsd: 247,
      maxRedeemableUsd: 74.1,
      maxRedeemablePoints: 7410,
      payableUsdAfterMaxRedemption: 172.9,
    });
    expect(response.items).toHaveLength(2);
    expect(response.items[1]).toMatchObject({
      productId: 'prod_backpack',
      quantity: 2,
      lineSubtotalUsd: 118,
    });
  });

  it('keeps redemption available when the 30 percent cap still clears the minimum points threshold', () => {
    const response = service.getCartQuote({
      items: [{ productId: 'prod_backpack', quantity: 1 }],
    });

    expect(response).toMatchObject({
      subtotalUsd: 59,
      maxRedeemableUsd: 17.7,
      maxRedeemablePoints: 1770,
      payableUsdAfterMaxRedemption: 41.3,
      redemption: {
        redemptionAvailable: true,
      },
    });
  });

  it('disables redemption when the computed cap is below the minimum redeemable usd', () => {
    const response = service.getCartQuote({
      items: [{ productId: 'prod_backpack', quantity: 0.2 }],
    });

    expect(response).toMatchObject({
      subtotalUsd: 11.8,
      maxRedeemableUsd: 0,
      maxRedeemablePoints: 0,
      payableUsdAfterMaxRedemption: 11.8,
      redemption: {
        redemptionAvailable: false,
      },
    });
  });

  it('throws not found when quote includes an unknown product', () => {
    expect(() =>
      service.getCartQuote({
        items: [{ productId: 'missing', quantity: 1 }],
      }),
    ).toThrow(NotFoundException);
  });

  it('creates and persists a mock reservation when the quote meets reserve rules', () => {
    const response = service.reserve({
      items: [{ productId: 'prod_headphones', quantity: 1 }],
      requestedPoints: 2000,
      availablePoints: 15200,
    });

    expect(response).toMatchObject({
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
    expect(response.reservationId).toMatch(/^rsv_/);
    expect(response.expiresAt).toBeTruthy();

    const confirmed = service.confirmReservation(response.reservationId!);
    expect(confirmed).toMatchObject({
      reservationId: response.reservationId,
      status: 'confirmed',
      requestedPoints: 2000,
      reservedPoints: 2000,
      coveredUsd: 20,
      payableUsd: 109,
    });
    expect(confirmed.expiresAt).toBeUndefined();
  });

  it('rejects reservation when requested points do not meet minimum rules', () => {
    const response = service.reserve({
      items: [{ productId: 'prod_headphones', quantity: 1 }],
      requestedPoints: 300,
      availablePoints: 15200,
    });

    expect(response).toMatchObject({
      source: 'mock',
      status: 'rejected',
      currency: 'USD',
      requestedPoints: 300,
      reservedPoints: 0,
      coveredUsd: 0,
      payableUsd: 129,
    });
  });

  it('cancels a reserved reservation', () => {
    const reservation = service.reserve({
      items: [{ productId: 'prod_headphones', quantity: 1 }],
      requestedPoints: 1500,
      availablePoints: 15200,
    });

    const cancelled = service.cancelReservation(reservation.reservationId!);

    expect(cancelled).toMatchObject({
      reservationId: reservation.reservationId,
      status: 'cancelled',
      requestedPoints: 1500,
      reservedPoints: 1500,
      coveredUsd: 15,
      payableUsd: 114,
    });
    expect(cancelled.expiresAt).toBeUndefined();
  });

  it('prevents confirming the same reservation twice', () => {
    const reservation = service.reserve({
      items: [{ productId: 'prod_headphones', quantity: 1 }],
      requestedPoints: 1200,
      availablePoints: 15200,
    });

    service.confirmReservation(reservation.reservationId!);

    expect(() => service.confirmReservation(reservation.reservationId!)).toThrow(
      BadRequestException,
    );
  });

  it('prevents cancelling an already confirmed reservation', () => {
    const reservation = service.reserve({
      items: [{ productId: 'prod_headphones', quantity: 1 }],
      requestedPoints: 1200,
      availablePoints: 15200,
    });

    service.confirmReservation(reservation.reservationId!);

    expect(() => service.cancelReservation(reservation.reservationId!)).toThrow(
      BadRequestException,
    );
  });

  it('prevents confirming an already cancelled reservation', () => {
    const reservation = service.reserve({
      items: [{ productId: 'prod_headphones', quantity: 1 }],
      requestedPoints: 1200,
      availablePoints: 15200,
    });

    service.cancelReservation(reservation.reservationId!);

    expect(() => service.confirmReservation(reservation.reservationId!)).toThrow(
      BadRequestException,
    );
  });

  it('throws not found when reservation does not exist', () => {
    expect(() => service.confirmReservation('rsv_missing')).toThrow(
      NotFoundException,
    );
    expect(() => service.cancelReservation('rsv_missing')).toThrow(
      NotFoundException,
    );
  });
});
