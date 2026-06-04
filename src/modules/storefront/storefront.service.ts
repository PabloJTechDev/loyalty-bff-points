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
    const normalizedItems = payload.items
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

  private roundUsd(value: number): number {
    return Number(value.toFixed(2));
  }

}
