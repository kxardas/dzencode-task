import { AuthModule } from './auth/auth.module.js';
import { Module } from '@nestjs/common';
import { OrdersModule } from './orders/orders.module.js';
import { ProductsModule } from './products/products.module.js';
import { SessionsModule } from './sessions/sessions.module.js';

@Module({ imports: [AuthModule, OrdersModule, ProductsModule, SessionsModule] })
export class AppModule {}
