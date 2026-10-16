import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type Product } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateProductDto } from './dto/create-product.dto.js';

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

  async create(input: CreateProductDto): Promise<ProductResponse> {
    const warrantyStart = new Date(`${input.warrantyStart}T00:00:00.000Z`);
    const warrantyEnd = new Date(`${input.warrantyEnd}T00:00:00.000Z`);
    if (warrantyEnd < warrantyStart) {
      throw new BadRequestException(
        'Warranty end must not precede warranty start',
      );
    }

    try {
      const product = await this.prisma.product.create({
        data: {
          orderId: input.orderId,
          title: input.title,
          type: input.type,
          serialNumber: input.serialNumber,
          isNew: input.isNew ?? true,
          specification: input.specification ?? '',
          photo: input.photo ?? null,
          warrantyStart,
          warrantyEnd,
          priceUSD: new Prisma.Decimal(input.priceUSD),
          priceUAH: new Prisma.Decimal(input.priceUAH),
        },
        include: { order: { select: { id: true, title: true } } },
      });
      return this.toResponse(product);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new NotFoundException(`Order ${input.orderId} not found`);
      }
      throw error;
    }
  }

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
