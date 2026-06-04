import type {
  StorefrontCategoryDto,
  StorefrontHomeResponseDto,
  StorefrontProductDetailDto,
  StorefrontProductDto,
} from '../dto/storefront-home-response.dto';

export const STOREFRONT_MIN_REDEEM_POINTS = 500;
export const STOREFRONT_REDEMPTION_RATE = 100;
export const STOREFRONT_REDEMPTION_RATE_LABEL = '100 pts = USD 1' as const;
export const STOREFRONT_MAX_REDEEMABLE_PERCENT = 30 as const;

export const storefrontCategoriesMock: StorefrontCategoryDto[] = [
  {
    id: 'electronics',
    name: 'Electrónica',
    description:
      'Productos de ticket medio/alto para demostrar compra en USD y canje parcial con puntos.',
  },
  {
    id: 'home',
    name: 'Hogar',
    description:
      'Artículos cotidianos que sirven para validar carrito, devoluciones y cambios.',
  },
  {
    id: 'accessories',
    name: 'Accesorios',
    description:
      'SKU livianos para probar promociones, acumulación y órdenes mixtas.',
  },
];

export const storefrontProductsMock: StorefrontProductDto[] = [
  {
    id: 'prod_headphones',
    sku: 'SKU-HEADPHONES-001',
    name: 'Audífonos inalámbricos',
    categoryId: 'electronics',
    categoryName: 'Electrónica',
    priceUsd: 129,
    redeemFromPoints: 8900,
    inventoryStatus: 'in_stock',
    note: 'Buen candidato para compra mixta USD + puntos.',
  },
  {
    id: 'prod_coffee_maker',
    sku: 'SKU-COFFEE-001',
    name: 'Cafetera compacta',
    categoryId: 'home',
    categoryName: 'Hogar',
    priceUsd: 89,
    redeemFromPoints: 6200,
    inventoryStatus: 'low_stock',
    note: 'Útil para probar devoluciones, cambio de producto y reserva de puntos.',
  },
  {
    id: 'prod_backpack',
    sku: 'SKU-BACKPACK-001',
    name: 'Mochila urbana',
    categoryId: 'accessories',
    categoryName: 'Accesorios',
    priceUsd: 59,
    redeemFromPoints: 4100,
    inventoryStatus: 'in_stock',
    note: 'SKU simple para empezar con catálogo y carrito sin mucha fricción.',
  },
];

export const storefrontProductDetailsMock: StorefrontProductDetailDto[] = [
  {
    ...storefrontProductsMock[0],
    description:
      'Audífonos bluetooth con cancelación de ruido, estuche de carga y autonomía pensada para journeys de compra mixta en storefront.',
    eligibilityNote:
      'Permite canje parcial hasta 30% del subtotal y requiere al menos 500 puntos para habilitar redención.',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1200&q=80',
    ],
    specifications: ['Bluetooth 5.3', '30 horas de batería', 'Carga USB-C'],
    redemption: {
      minRedeemPoints: STOREFRONT_MIN_REDEEM_POINTS,
      redemptionRate: STOREFRONT_REDEMPTION_RATE_LABEL,
      maxRedeemablePercent: STOREFRONT_MAX_REDEEMABLE_PERCENT,
    },
  },
  {
    ...storefrontProductsMock[1],
    description:
      'Cafetera compacta para cocinas pequeñas, útil para validar escenarios de carrito con low stock y cambios post compra.',
    eligibilityNote:
      'La quote mock respeta el mismo tope de 30% y la misma tasa de redención para mantener consistencia entre productos.',
    imageUrl: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
    ],
    specifications: ['Capacidad 1.2L', 'Filtro reusable', 'Apagado automático'],
    redemption: {
      minRedeemPoints: STOREFRONT_MIN_REDEEM_POINTS,
      redemptionRate: STOREFRONT_REDEMPTION_RATE_LABEL,
      maxRedeemablePercent: STOREFRONT_MAX_REDEEMABLE_PERCENT,
    },
  },
  {
    ...storefrontProductsMock[2],
    description:
      'Mochila urbana con compartimento para notebook y formato ideal para validar órdenes de varios ítems con ticket medio bajo.',
    eligibilityNote:
      'Aunque el SKU es simple, el cálculo de quote sigue exactamente las mismas reglas de redención del slice.',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80',
    ],
    specifications: ['Notebook hasta 15"', 'Tela repelente al agua', 'Capacidad 18L'],
    redemption: {
      minRedeemPoints: STOREFRONT_MIN_REDEEM_POINTS,
      redemptionRate: STOREFRONT_REDEMPTION_RATE_LABEL,
      maxRedeemablePercent: STOREFRONT_MAX_REDEEMABLE_PERCENT,
    },
  },
];

export const storefrontHomeMock: Omit<StorefrontHomeResponseDto, 'source'> = {
  hero: {
    title: 'Storefront demo conectado con loyalty',
    subtitle:
      'Catálogo inicial con precios en USD, canje desde puntos y mensajes simples para el primer slice.',
    primaryCta: {
      label: 'Explorar catálogo',
      target: '/shop',
    },
    secondaryCta: {
      label: 'Revisar wallet',
      target: '/wallet',
    },
  },
  highlights: ['USD pricing', 'Canje con puntos', 'Checkout híbrido'],
  categories: storefrontCategoriesMock,
  featuredProducts: storefrontProductsMock,
};
