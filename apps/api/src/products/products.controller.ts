import { Controller, Get, Param, Query, ValidationPipe } from '@nestjs/common';
import { ProductIdDto } from './dto/product-id.dto.js';
import { ProductsQueryDto } from './dto/products-query.dto.js';
import { ProductsService, type ProductResponse } from './products.service.js';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(
    @Query(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    query: ProductsQueryDto,
  ): Promise<{ data: ProductResponse[] }> {
    return { data: await this.productsService.findAll(query.type) };
  }

  @Get(':id')
  async findOne(
    @Param(new ValidationPipe({ transform: true })) params: ProductIdDto,
  ): Promise<{ data: ProductResponse }> {
    return { data: await this.productsService.findOne(params.id) };
  }
}
