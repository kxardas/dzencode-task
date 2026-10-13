import { Injectable, NotFoundException } from '@nestjs/common';
import type { Product } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

export interface ProductResponse {
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
  order: { id: number; title: string };
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(type?: string): Promise<ProductResponse[]> {
    const products = await this.prisma.product.findMany({
      where: type === undefined ? {} : { type },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: { order: { select: { id: true, title: true } } },
    });

    return products.map((product) => this.toResponse(product));
  }

  async findOne(id: number): Promise<ProductResponse> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { order: { select: { id: true, title: true } } },
    });

    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }

    return this.toResponse(product);
  }

  private toResponse(
    product: Product & { order: { id: number; title: string } },
  ): ProductResponse {
    return {
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
      order: product.order,
    };
  }
}
