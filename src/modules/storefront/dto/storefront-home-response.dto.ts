export interface StorefrontCategoryDto {
  id: string;
  name: string;
  description: string;
}

export interface StorefrontProductDto {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  categoryName: string;
  priceUsd: number;
  redeemFromPoints: number;
  inventoryStatus: 'in_stock' | 'low_stock';
  note: string;
}

export interface StorefrontProductDetailDto extends StorefrontProductDto {
  description: string;
  eligibilityNote: string;
  imageUrl: string;
  gallery: string[];
  specifications: string[];
  redemption: {
    minRedeemPoints: number;
    redemptionRate: '100 pts = USD 1';
    maxRedeemablePercent: 30;
  };
}

export interface StorefrontHomeResponseDto {
  hero: {
    title: string;
    subtitle: string;
    primaryCta: {
      label: string;
      target: string;
    };
    secondaryCta: {
      label: string;
      target: string;
    };
  };
  highlights: string[];
  categories: StorefrontCategoryDto[];
  featuredProducts: StorefrontProductDto[];
  source: 'mock';
}

export interface StorefrontCategoriesResponseDto {
  total: number;
  items: StorefrontCategoryDto[];
  source: 'mock';
}

export interface StorefrontProductsQueryDto {
  categoryId?: string;
}

export interface StorefrontProductsResponseDto {
  total: number;
  items: StorefrontProductDto[];
  source: 'mock';
}

export interface StorefrontProductDetailResponseDto {
  item: StorefrontProductDetailDto;
  source: 'mock';
}

export interface StorefrontCartQuoteRequestItemDto {
  productId: string;
  quantity: number;
}

export interface StorefrontCartQuoteRequestDto {
  items: StorefrontCartQuoteRequestItemDto[];
}

export interface StorefrontReserveRequestLineDto {
  productId: string;
  quantity: number;
}

export interface StorefrontReserveRequestDto {
  items?: StorefrontCartQuoteRequestItemDto[];
  lines?: StorefrontReserveRequestLineDto[];
  requestedPoints?: number;
  appliedPoints?: number;
  availablePoints?: number;
  subtotalUsd?: number;
  currency?: 'USD';
}

export interface StorefrontCartQuoteItemDto {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPriceUsd: number;
  lineSubtotalUsd: number;
  categoryId: string;
  categoryName: string;
}

export interface StorefrontCartQuoteResponseDto {
  currency: 'USD';
  items: StorefrontCartQuoteItemDto[];
  itemCount: number;
  subtotalUsd: number;
  maxRedeemableUsd: number;
  maxRedeemablePoints: number;
  payableUsdAfterMaxRedemption: number;
  redemption: {
    minRedeemPoints: number;
    minRedeemableUsd: number;
    redemptionRate: '100 pts = USD 1';
    maxRedeemablePercent: 30;
    redemptionAvailable: boolean;
  };
  source: 'mock';
}

export interface StorefrontReserveResponseDto {
  source: 'mock';
  status: 'reserved' | 'rejected';
  reservationId?: string;
  expiresAt?: string;
  currency: 'USD';
  requestedPoints: number;
  reservedPoints: number;
  coveredUsd: number;
  payableUsd: number;
  message: string;
  rulesApplied: {
    minRedeemPoints: number;
    redemptionRate: '100 pts = USD 1';
    maxRedeemablePercent: 30;
    availablePoints: number;
    maxAllowedPoints: number;
  };
}
