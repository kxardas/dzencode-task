import { Injectable, NotFoundException } from '@nestjs/common';
import {
  Prisma,
  type Order,
  type Product,
} from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

export interface OrderSummary {
  id: number;
  title: string;
  description: string;
  createdAt: string;
  productCount: number;
  totalUSD: string;
  totalUAH: string;
}

export interface OrderProduct {
  id: number;
  orderId: number;
  title: string;
  type: string;
  serialNumber: string;
  isNew: boolean;
  photo: string | null;
  specification: string;
  warrantyStart: string;
  warrantyEnd: string;
  priceUSD: string;
  priceUAH: string;
  createdAt: string;
}

export interface OrderDetails extends OrderSummary {
  products: OrderProduct[];
}

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<OrderSummary[]> {
    const orders = await this.prisma.order.findMany({
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: {
        products: { select: { priceUSD: true, priceUAH: true } },
      },
    });

    return orders.map((order) => this.toSummary(order));
  }

  async findOne(id: number): Promise<OrderDetails> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        products: { orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }

    return {
      ...this.toSummary(order),
      products: order.products.map((product) => ({
        id: product.id,
        orderId: product.orderId,
        title: product.title,
        type: product.type,
        serialNumber: product.serialNumber,
        isNew: product.isNew,
        photo: product.photo,
        specification: product.specification,
        warrantyStart: product.warrantyStart.toISOString(),
        warrantyEnd: product.warrantyEnd.toISOString(),
        priceUSD: product.priceUSD.toFixed(2),
        priceUAH: product.priceUAH.toFixed(2),
        createdAt: product.createdAt.toISOString(),
      })),
    };
  }

  async remove(id: number): Promise<void> {
    const { count } = await this.prisma.order.deleteMany({ where: { id } });

    if (count === 0) {
      throw new NotFoundException(`Order ${id} not found`);
    }
  }

  private toSummary(
    order: Order & { products: Pick<Product, 'priceUSD' | 'priceUAH'>[] },
  ): OrderSummary {
    let totalUSD = new Prisma.Decimal(0);
    let totalUAH = new Prisma.Decimal(0);

    for (const product of order.products) {
      totalUSD = totalUSD.plus(product.priceUSD);
      totalUAH = totalUAH.plus(product.priceUAH);
    }

    return {
      id: order.id,
      title: order.title,
      description: order.description,
      createdAt: order.createdAt.toISOString(),
      productCount: order.products.length,
      totalUSD: totalUSD.toFixed(2),
      totalUAH: totalUAH.toFixed(2),
    };
  }
}
