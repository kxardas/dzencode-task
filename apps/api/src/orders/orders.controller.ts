import { AuthGuard } from '../auth/auth.guard.js';
import { WriteOriginGuard } from '../auth/write-origin.guard.js';
import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import { OrderIdDto } from './dto/order-id.dto.js';
import {
  OrdersService,
  type OrderDetails,
  type OrderSummary,
} from './orders.service.js';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  async findAll(): Promise<{ data: OrderSummary[] }> {
    return { data: await this.ordersService.findAll() };
  }

  @Get(':id')
  async findOne(
    @Param(new ValidationPipe({ transform: true })) params: OrderIdDto,
  ): Promise<{ data: OrderDetails }> {
    return { data: await this.ordersService.findOne(params.id) };
  }

  @Delete(':id')
  @UseGuards(WriteOriginGuard, AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param(new ValidationPipe({ transform: true })) params: OrderIdDto,
  ): Promise<void> {
    await this.ordersService.remove(params.id);
  }
}
