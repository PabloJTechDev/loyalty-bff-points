import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  STOREFRONT_MAX_REDEEMABLE_PERCENT,
  STOREFRONT_MIN_REDEEM_POINTS,
  STOREFRONT_REDEMPTION_RATE,
  STOREFRONT_REDEMPTION_RATE_LABEL,
  storefrontCategoriesMock,
  storefrontHomeMock,
  storefrontProductDetailsMock,
  storefrontProductsMock,
} from './mocks/storefront.mock';
import type {
  StorefrontCartQuoteRequestDto,
  StorefrontCartQuoteResponseDto,
  StorefrontHomeResponseDto,
  StorefrontProductDetailResponseDto,
  StorefrontProductsQueryDto,
  StorefrontProductsResponseDto,
  StorefrontCategoriesResponseDto,
  StorefrontReserveRequestDto,
  StorefrontReserveResponseDto,
  StorefrontReservationStateResponseDto,
  StorefrontPlaceOrderRequestDto,
  StorefrontOrderResponseDto,
  StorefrontOrderLineDto,
} from './dto/storefront-home-response.dto';

type MockReservationRecord = Omit<StorefrontReservationStateResponseDto, 'message'> & {
  createdAt: string;
};

type MockOrderRecord = Omit<StorefrontOrderResponseDto, 'message'>;

@Injectable()
export class StorefrontService {
  private readonly reservations = new Map<string, MockReservationRecord>();

  private readonly orders = new Map<string, MockOrderRecord>();

  getHome(): StorefrontHomeResponseDto {
    return {
      ...storefrontHomeMock,
      source: 'mock',
    };
  }

  getCategories(): StorefrontCategoriesResponseDto {
    return {
      total: storefrontCategoriesMock.length,
      items: storefrontCategoriesMock,
      source: 'mock',
    };
  }

  getProducts(query: StorefrontProductsQueryDto = {}): StorefrontProductsResponseDto {
    const items = query.categoryId
      ? storefrontProductsMock.filter(
          (product) => product.categoryId === query.categoryId,
        )
      : storefrontProductsMock;

    return {
      total: items.length,
      items,
      source: 'mock',
    };
  }

  getProductDetail(productId: string): StorefrontProductDetailResponseDto {
    const item = storefrontProductDetailsMock.find(
      (product) => product.id === productId,
    );

    if (!item) {
      throw new NotFoundException(`Storefront product ${productId} not found`);
    }

    return {
      item,
      source: 'mock',
    };
  }

  getCartQuote(payload: StorefrontCartQuoteRequestDto): StorefrontCartQuoteResponseDto {
    const normalizedItems = this.normalizeQuoteItems(payload.items);

    return this.buildQuoteFromNormalizedItems(normalizedItems);
  }

  reserve(payload: StorefrontReserveRequestDto): StorefrontReserveResponseDto {
    const quoteItems = payload.items ?? payload.lines ?? [];
    const quote = this.getCartQuote({ items: quoteItems });
    const maxAllowedPointsFromWallet = Number.isFinite(payload.availablePoints)
      ? Math.max(0, Math.floor(payload.availablePoints ?? 0))
      : quote.maxRedeemablePoints;
    const maxAllowedPoints = Math.min(
      quote.maxRedeemablePoints,
      maxAllowedPointsFromWallet,
    );
    const requestedPointsInput = Number.isFinite(payload.requestedPoints)
      ? Math.max(0, Math.floor(payload.requestedPoints ?? 0))
      : Number.isFinite(payload.appliedPoints)
        ? Math.max(0, Math.floor(payload.appliedPoints ?? 0))
        : maxAllowedPoints;
    const reservedPoints =
      quote.redemption.redemptionAvailable &&
      requestedPointsInput >= STOREFRONT_MIN_REDEEM_POINTS &&
      maxAllowedPoints >= STOREFRONT_MIN_REDEEM_POINTS
        ? Math.min(requestedPointsInput, maxAllowedPoints)
        : 0;
    const coveredUsd = this.roundUsd(reservedPoints / STOREFRONT_REDEMPTION_RATE);
    const payableUsd = this.roundUsd(Math.max(0, quote.subtotalUsd - coveredUsd));
    const status = reservedPoints >= STOREFRONT_MIN_REDEEM_POINTS ? 'reserved' : 'rejected';

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString();
    const rulesApplied = {
      minRedeemPoints: STOREFRONT_MIN_REDEEM_POINTS,
      redemptionRate: STOREFRONT_REDEMPTION_RATE_LABEL,
      maxRedeemablePercent: STOREFRONT_MAX_REDEEMABLE_PERCENT,
      availablePoints: maxAllowedPointsFromWallet,
      maxAllowedPoints,
    } as const;

    if (status !== 'reserved') {
      return {
        source: 'mock',
        status,
        reservationId: undefined,
        expiresAt: undefined,
        currency: 'USD',
        requestedPoints: requestedPointsInput,
        reservedPoints,
        coveredUsd,
        payableUsd,
        message:
          quote.items.length === 0
            ? 'Cart is empty. Add at least one item before reserving points.'
            : `At least ${STOREFRONT_MIN_REDEEM_POINTS} points must be applied and available before reserving.`,
        rulesApplied,
      };
    }

    const reservationId = `rsv_${now.getTime().toString(36)}_${this.reservations.size + 1}`;
    const reservation: MockReservationRecord = {
      source: 'mock',
      reservationId,
      status: 'reserved',
      expiresAt,
      currency: 'USD',
      requestedPoints: requestedPointsInput,
      reservedPoints,
      coveredUsd,
      payableUsd,
      rulesApplied,
      createdAt: now.toISOString(),
    };

    this.reservations.set(reservationId, reservation);

    return {
      ...this.toReservationResponse(
        reservation,
        'Points reserved successfully using the mock storefront reserve flow.',
      ),
      status: 'reserved',
    };
  }

  confirmReservation(reservationId: string): StorefrontReservationStateResponseDto {
    const reservation = this.getStoredReservation(reservationId);

    if (reservation.status === 'confirmed') {
      throw new BadRequestException(
        `Reservation ${reservationId} is already confirmed.`,
      );
    }

    if (reservation.status === 'cancelled') {
      throw new BadRequestException(
        `Reservation ${reservationId} is already cancelled and cannot be confirmed.`,
      );
    }

    reservation.status = 'confirmed';
    reservation.expiresAt = undefined;

    return this.toReservationResponse(
      reservation,
      'Reservation confirmed successfully using the mock storefront reserve flow.',
    );
  }

  cancelReservation(reservationId: string): StorefrontReservationStateResponseDto {
    const reservation = this.getStoredReservation(reservationId);

    if (reservation.status === 'cancelled') {
      throw new BadRequestException(
        `Reservation ${reservationId} is already cancelled.`,
      );
    }

    if (reservation.status === 'confirmed') {
      throw new BadRequestException(
        `Reservation ${reservationId} is already confirmed and cannot be cancelled.`,
      );
    }

    reservation.status = 'cancelled';
    reservation.expiresAt = undefined;

    return this.toReservationResponse(
      reservation,
      'Reservation cancelled successfully using the mock storefront reserve flow.',
    );
  }

  placeOrder(payload: StorefrontPlaceOrderRequestDto): StorefrontOrderResponseDto {
    if (!payload.reservationId) {
      throw new BadRequestException('reservationId is required before placing an order.');
    }

    const reservation = this.getStoredReservation(payload.reservationId);

    if (reservation.status !== 'confirmed') {
      throw new BadRequestException(
        `Reservation ${payload.reservationId} must be confirmed before placing an order.`,
      );
    }

    const existingOrder = Array.from(this.orders.values()).find(
      (order) => order.reservationId === payload.reservationId,
    );

    if (existingOrder) {
      throw new BadRequestException(
        `Order already placed for reservation ${payload.reservationId}.`,
      );
    }

    const orderItems = payload.items ?? payload.lines ?? [];
    const normalizedLines = this.normalizeQuoteItems(orderItems);

    if (!normalizedLines.length) {
      throw new BadRequestException('At least one order line is required before placing an order.');
    }

    const subtotalUsd = this.roundUsd(
      normalizedLines.reduce((acc, item) => acc + item.lineSubtotalUsd, 0),
    );
    const requestedPoints = Number.isFinite(payload.requestedPoints)
      ? Math.max(0, Math.floor(payload.requestedPoints ?? 0))
      : reservation.requestedPoints;
    const reservedPoints = Number.isFinite(payload.reservedPoints)
      ? Math.max(0, Math.floor(payload.reservedPoints ?? 0))
      : reservation.reservedPoints;
    const coveredUsd = Number.isFinite(payload.coveredUsd)
      ? this.roundUsd(payload.coveredUsd ?? 0)
      : reservation.coveredUsd;
    const payableUsd = Number.isFinite(payload.payableUsd)
      ? this.roundUsd(payload.payableUsd ?? subtotalUsd)
      : this.roundUsd(Math.max(0, subtotalUsd - coveredUsd));
    const itemCount = normalizedLines.reduce((acc, item) => acc + item.quantity, 0);
    const now = new Date();
    const orderId = `ord_${now.getTime().toString(36)}_${this.orders.size + 1}`;

    const order: MockOrderRecord = {
      source: 'mock',
      orderId,
      reservationId: reservation.reservationId,
      status: 'placed',
      currency: 'USD',
      createdAt: now.toISOString(),
      lines: normalizedLines.map<StorefrontOrderLineDto>((line) => ({ ...line })),
      summary: {
        itemCount,
        subtotalUsd,
        requestedPoints,
        reservedPoints,
        coveredUsd,
        payableUsd,
      },
    };

    this.orders.set(orderId, order);

    return {
      ...order,
      message: 'Order placed successfully using the mock storefront order flow.',
    };
  }

  getOrderById(orderId: string): StorefrontOrderResponseDto {
    const order = this.orders.get(orderId);

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    return {
      ...order,
      message: 'Order loaded successfully using the mock storefront order flow.',
    };
  }

  private getStoredReservation(reservationId: string): MockReservationRecord {
    const reservation = this.reservations.get(reservationId);

    if (!reservation) {
      throw new NotFoundException(`Reservation ${reservationId} not found`);
    }

    return reservation;
  }

  private toReservationResponse(
    reservation: MockReservationRecord,
    message: string,
  ): StorefrontReservationStateResponseDto {
    return {
      source: reservation.source,
      reservationId: reservation.reservationId,
      status: reservation.status,
      expiresAt: reservation.expiresAt,
      currency: reservation.currency,
      requestedPoints: reservation.requestedPoints,
      reservedPoints: reservation.reservedPoints,
      coveredUsd: reservation.coveredUsd,
      payableUsd: reservation.payableUsd,
      message,
      rulesApplied: reservation.rulesApplied,
    };
  }

  private buildQuoteFromNormalizedItems(
    normalizedItems: StorefrontCartQuoteResponseDto['items'],
  ): StorefrontCartQuoteResponseDto {
    const subtotalUsd = this.roundUsd(
      normalizedItems.reduce((acc, item) => acc + item.lineSubtotalUsd, 0),
    );
    const itemCount = normalizedItems.reduce((acc, item) => acc + item.quantity, 0);

    const rawMaxRedeemableUsd = subtotalUsd * (STOREFRONT_MAX_REDEEMABLE_PERCENT / 100);
    const maxRedeemableUsd = this.roundUsd(rawMaxRedeemableUsd);
    const maxRedeemablePoints = Math.round(
      maxRedeemableUsd * STOREFRONT_REDEMPTION_RATE,
    );
    const redemptionAvailable =
      maxRedeemablePoints >= STOREFRONT_MIN_REDEEM_POINTS && maxRedeemableUsd > 0;

    return {
      currency: 'USD',
      items: normalizedItems,
      itemCount,
      subtotalUsd,
      maxRedeemableUsd: redemptionAvailable ? maxRedeemableUsd : 0,
      maxRedeemablePoints: redemptionAvailable ? maxRedeemablePoints : 0,
      payableUsdAfterMaxRedemption: this.roundUsd(
        subtotalUsd - (redemptionAvailable ? maxRedeemableUsd : 0),
      ),
      redemption: {
        minRedeemPoints: STOREFRONT_MIN_REDEEM_POINTS,
        minRedeemableUsd: STOREFRONT_MIN_REDEEM_POINTS / STOREFRONT_REDEMPTION_RATE,
        redemptionRate: STOREFRONT_REDEMPTION_RATE_LABEL,
        maxRedeemablePercent: STOREFRONT_MAX_REDEEMABLE_PERCENT,
        redemptionAvailable,
      },
      source: 'mock',
    };
  }

  private normalizeQuoteItems(
    items: StorefrontCartQuoteRequestDto['items'],
  ): StorefrontCartQuoteResponseDto['items'] {
    return items
      .filter((item) => Number.isFinite(item.quantity) && item.quantity > 0)
      .map((item) => {
        const product = storefrontProductsMock.find(
          (candidate) => candidate.id === item.productId,
        );

        if (!product) {
          throw new NotFoundException(
            `Storefront product ${item.productId} not found`,
          );
        }

        const lineSubtotalUsd = this.roundUsd(product.priceUsd * item.quantity);

        return {
          productId: product.id,
          sku: product.sku,
          name: product.name,
          quantity: item.quantity,
          unitPriceUsd: product.priceUsd,
          lineSubtotalUsd,
          categoryId: product.categoryId,
          categoryName: product.categoryName,
        };
      });
  }

  private roundUsd(value: number): number {
    return Number(value.toFixed(2));
  }
}
