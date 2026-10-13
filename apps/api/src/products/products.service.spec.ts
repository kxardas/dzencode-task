import { NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { ProductsService } from './products.service.js';

describe('ProductsService', () => {
  const findMany = vi.fn();
  const findUnique = vi.fn();
  const prisma = {
    product: { findMany, findUnique },
  } as unknown as PrismaService;
  const service = new ProductsService(prisma);

  beforeEach(() => {
    findMany.mockReset();
    findUnique.mockReset();
  });

  it('returns an empty collection when there are no matching products', async () => {
    findMany.mockResolvedValue([]);
    await expect(service.findAll('Unknown type')).resolves.toEqual([]);
  });

  it('serializes prices, UTC dates, and the associated order consistently', async () => {
    const product = {
      id: 123,
      orderId: 5,
      title: 'Test monitor',
      type: 'Monitors',
      serialNumber: '0001',
      isNew: false,
      photo: null,
      specification: 'Full HD',
      warrantyStart: new Date('2026-10-01T00:00:00.000Z'),
      warrantyEnd: new Date('2028-10-01T00:00:00.000Z'),
      priceUSD: new Prisma.Decimal('0.10'),
      priceUAH: new Prisma.Decimal('4.10'),
      createdAt: new Date('2026-10-13T12:00:00.123Z'),
      order: { id: 5, title: 'Office delivery' },
    };
    const expected = {
      ...product,
      warrantyStart: '2026-10-01T00:00:00.000Z',
      warrantyEnd: '2028-10-01T00:00:00.000Z',
      priceUSD: '0.10',
      priceUAH: '4.10',
      createdAt: '2026-10-13T12:00:00.123Z',
    };
    findMany.mockResolvedValue([product]);
    findUnique.mockResolvedValue(product);
    await expect(service.findAll()).resolves.toEqual([expected]);
    await expect(service.findOne(123)).resolves.toEqual(expected);
  });

  it('reports a missing product as not found', async () => {
    findUnique.mockResolvedValue(null);
    await expect(service.findOne(123)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('propagates database failures instead of returning empty or missing results', async () => {
    const error = new Error('Database unavailable');
    findMany.mockRejectedValue(error);
    findUnique.mockRejectedValue(error);
    await expect(service.findAll()).rejects.toBe(error);
    await expect(service.findOne(123)).rejects.toBe(error);
  });
});
