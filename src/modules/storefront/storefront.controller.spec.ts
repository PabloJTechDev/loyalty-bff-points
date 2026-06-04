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
});
