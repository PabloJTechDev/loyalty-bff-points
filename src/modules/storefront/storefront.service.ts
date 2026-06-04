import { Injectable, NotFoundException } from '@nestjs/common';
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
} from './dto/storefront-home-response.dto';

@Injectable()
export class StorefrontService {
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

    return {
      source: 'mock',
      status,
      reservationId:
        status === 'reserved'
          ? `rsv_${now.getTime().toString(36)}`
          : undefined,
      expiresAt: status === 'reserved' ? expiresAt : undefined,
      currency: 'USD',
      requestedPoints: requestedPointsInput,
      reservedPoints,
      coveredUsd,
      payableUsd,
      message:
        status === 'reserved'
          ? 'Points reserved successfully using the mock storefront reserve flow.'
          : quote.items.length === 0
            ? 'Cart is empty. Add at least one item before reserving points.'
            : `At least ${STOREFRONT_MIN_REDEEM_POINTS} points must be applied and available before reserving.`,
      rulesApplied: {
        minRedeemPoints: STOREFRONT_MIN_REDEEM_POINTS,
        redemptionRate: STOREFRONT_REDEMPTION_RATE_LABEL,
        maxRedeemablePercent: STOREFRONT_MAX_REDEEMABLE_PERCENT,
        availablePoints: maxAllowedPointsFromWallet,
        maxAllowedPoints,
      },
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
