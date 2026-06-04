import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { StorefrontService } from './storefront.service';
import type {
  StorefrontCartQuoteRequestDto,
  StorefrontCartQuoteResponseDto,
  StorefrontCategoriesResponseDto,
  StorefrontHomeResponseDto,
  StorefrontProductDetailResponseDto,
  StorefrontProductsQueryDto,
  StorefrontProductsResponseDto,
  StorefrontReserveRequestDto,
  StorefrontReserveResponseDto,
  StorefrontReservationStateResponseDto,
} from './dto/storefront-home-response.dto';

@Controller('v1/storefront')
export class StorefrontController {
  constructor(private readonly storefrontService: StorefrontService) {}

  @Get('home')
  getHome(): StorefrontHomeResponseDto {
    return this.storefrontService.getHome();
  }

  @Get('categories')
  getCategories(): StorefrontCategoriesResponseDto {
    return this.storefrontService.getCategories();
  }

  @Get('products')
  getProducts(
    @Query() query: StorefrontProductsQueryDto,
  ): StorefrontProductsResponseDto {
    return this.storefrontService.getProducts(query);
  }

  @Get('products/:productId')
  getProductDetail(
    @Param('productId') productId: string,
  ): StorefrontProductDetailResponseDto {
    return this.storefrontService.getProductDetail(productId);
  }

  @Post('cart/quote')
  getCartQuote(
    @Body() payload: StorefrontCartQuoteRequestDto,
  ): StorefrontCartQuoteResponseDto {
    return this.storefrontService.getCartQuote(payload);
  }

  @Post('redemptions/reserve')
  reserve(
    @Body() payload: StorefrontReserveRequestDto,
  ): StorefrontReserveResponseDto {
    return this.storefrontService.reserve(payload);
  }

  @Post('redemptions/reservations/:reservationId/confirm')
  confirmReservation(
    @Param('reservationId') reservationId: string,
  ): StorefrontReservationStateResponseDto {
    return this.storefrontService.confirmReservation(reservationId);
  }

  @Post('redemptions/reservations/:reservationId/cancel')
  cancelReservation(
    @Param('reservationId') reservationId: string,
  ): StorefrontReservationStateResponseDto {
    return this.storefrontService.cancelReservation(reservationId);
  }
}
