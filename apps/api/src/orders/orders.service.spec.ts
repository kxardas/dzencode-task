import { NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { OrdersService } from './orders.service.js';

describe('OrdersService', () => {
  const findMany = vi.fn();
  const findUnique = vi.fn();
  const deleteMany = vi.fn();
  const prisma = {
    order: { findMany, findUnique, deleteMany },
  } as unknown as PrismaService;
  const service = new OrdersService(prisma);
  const createdAt = new Date('2026-10-13T12:00:00.123Z');

  beforeEach(() => {
    findMany.mockReset();
    findUnique.mockReset();
    deleteMany.mockReset();
  });

  it('returns an empty collection when there are no orders', async () => {
    findMany.mockResolvedValue([]);
    await expect(service.findAll()).resolves.toEqual([]);
  });

  it('returns zero counts and formatted totals for an empty order', async () => {
    findMany.mockResolvedValue([
      { id: 1, title: 'Empty order', description: '', createdAt, products: [] },
    ]);

    await expect(service.findAll()).resolves.toEqual([
      {
        id: 1,
        title: 'Empty order',
        description: '',
        createdAt: '2026-10-13T12:00:00.123Z',
        productCount: 0,
        totalUSD: '0.00',
        totalUAH: '0.00',
      },
    ]);
  });

  it('calculates independent decimal totals from each orders products', async () => {
    findMany.mockResolvedValue([
      {
        id: 1,
        title: 'First order',
        description: 'Two products',
        createdAt,
        products: [
          {
            priceUSD: new Prisma.Decimal('0.10'),
            priceUAH: new Prisma.Decimal('1.11'),
          },
          {
            priceUSD: new Prisma.Decimal('0.20'),
            priceUAH: new Prisma.Decimal('2.22'),
          },
        ],
      },
      {
        id: 2,
        title: 'Second order',
        description: 'One product',
        createdAt,
        products: [
          {
            priceUSD: new Prisma.Decimal('19.90'),
            priceUAH: new Prisma.Decimal('822.25'),
          },
        ],
      },
    ]);

    await expect(service.findAll()).resolves.toEqual([
      {
        id: 1,
        title: 'First order',
        description: 'Two products',
        createdAt: '2026-10-13T12:00:00.123Z',
        productCount: 2,
        totalUSD: '0.30',
        totalUAH: '3.33',
      },
      {
        id: 2,
        title: 'Second order',
        description: 'One product',
        createdAt: '2026-10-13T12:00:00.123Z',
        productCount: 1,
        totalUSD: '19.90',
        totalUAH: '822.25',
      },
    ]);
  });

  it('propagates a database failure rather than returning an empty list', async () => {
    const error = new Error('Database unavailable');
    findMany.mockRejectedValue(error);
    await expect(service.findAll()).rejects.toBe(error);
  });

  it('reports a missing order as not found', async () => {
    findUnique.mockResolvedValue(null);
    await expect(service.findOne(123)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('propagates a detail lookup failure rather than reporting a missing order', async () => {
    const error = new Error('Database unavailable');
    findUnique.mockRejectedValue(error);
    await expect(service.findOne(123)).rejects.toBe(error);
  });

  it('completes deletion when an order was removed', async () => {
    deleteMany.mockResolvedValue({ count: 1 });
    await expect(service.remove(123)).resolves.toBeUndefined();
  });

  it('reports deletion of a missing order as not found', async () => {
    deleteMany.mockResolvedValue({ count: 0 });
    await expect(service.remove(123)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('propagates a deletion failure rather than reporting success or a missing order', async () => {
    const error = new Error('Database unavailable');
    deleteMany.mockRejectedValue(error);
    await expect(service.remove(123)).rejects.toBe(error);
  });
});
