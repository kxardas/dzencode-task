import '../src/config/environment.js';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../dist/app.module.js';
import { PrismaService } from '../dist/prisma/prisma.service.js';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { createDatabaseAdapter } from '../src/prisma/prisma.adapter.js';

const input = {
  orderId: 1,
  title: ' Test product ',
  type: ' Monitors ',
  serialNumber: ' SERIAL-001 ',
  warrantyStart: '2026-10-01',
  warrantyEnd: '2028-10-01',
  priceUSD: ' 0.1 ',
  priceUAH: '4.1',
};

async function createApp(database: unknown): Promise<INestApplication> {
  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService)
    .useValue(database)
    .compile();
  const app = module.createNestApplication({ logger: false });
  app.setGlobalPrefix('api');
  await app.init();
  return app;
}

describe('Product creation HTTP API', () => {
  it('persists normalized products, updates order totals, and handles a deleted parent order', async () => {
    const prisma = new PrismaClient({ adapter: createDatabaseAdapter() });
    const rollback = new Error('Roll back product creation HTTP fixtures');
    try {
      await prisma.$transaction(async (transaction) => {
        const order = await transaction.order.create({
          data: { title: 'Product creation test order', description: '' },
        });
        const app = await createApp({
          product: transaction.product,
          order: transaction.order,
        });
        try {
          const first = await request(app.getHttpServer())
            .post('/api/products')
            .send({ ...input, orderId: order.id })
            .expect(201);
          expect(first.body.data).toMatchObject({
            orderId: order.id,
            title: 'Test product',
            type: 'Monitors',
            serialNumber: 'SERIAL-001',
            isNew: true,
            specification: '',
            photo: null,
            warrantyStart: '2026-10-01T00:00:00.000Z',
            warrantyEnd: '2028-10-01T00:00:00.000Z',
            priceUSD: '0.10',
            priceUAH: '4.10',
            order: { id: order.id, title: order.title },
          });
          expect(Number.isNaN(Date.parse(first.body.data.createdAt))).toBe(
            false,
          );
          const stored = await transaction.product.findUniqueOrThrow({
            where: { id: first.body.data.id },
          });
          expect(stored.priceUSD.toFixed(2)).toBe('0.10');
          expect(stored.warrantyStart.toISOString()).toBe(
            '2026-10-01T00:00:00.000Z',
          );

          await request(app.getHttpServer())
            .get(`/api/products/${stored.id}`)
            .expect(200)
            .expect(first.body);
          const second = await request(app.getHttpServer())
            .post('/api/products')
            .send({
              ...input,
              orderId: order.id,
              priceUSD: '0.20',
              priceUAH: '8.20',
              isNew: false,
              specification: ' Full HD ',
              photo: ' https://example.com/monitor.jpg ',
              warrantyEnd: input.warrantyStart,
            })
            .expect(201);
          expect(second.body.data).toMatchObject({
            isNew: false,
            specification: 'Full HD',
            photo: 'https://example.com/monitor.jpg',
          });
          const detail = await request(app.getHttpServer())
            .get(`/api/orders/${order.id}`)
            .expect(200);
          expect(detail.body.data).toMatchObject({
            productCount: 2,
            totalUSD: '0.30',
            totalUAH: '12.30',
          });
          expect(detail.body.data.products).toHaveLength(2);

          await transaction.order.delete({ where: { id: order.id } });
          await request(app.getHttpServer())
            .post('/api/products')
            .send({ ...input, orderId: order.id })
            .expect(404);
          expect(
            await transaction.product.count({ where: { orderId: order.id } }),
          ).toBe(0);
        } finally {
          await app.close();
        }
        throw rollback;
      });
    } catch (error) {
      if (error !== rollback) throw error;
    } finally {
      await prisma.$disconnect();
    }
  });

  it('rejects invalid fields, dates, prices, and unknown properties before database writes', async () => {
    const create = vi.fn();
    const app = await createApp({ product: { create } });
    try {
      const invalidInputs = [
        {},
        { ...input, title: '   ' },
        { ...input, title: 'x'.repeat(256) },
        { ...input, type: '' },
        { ...input, type: 'x'.repeat(101) },
        { ...input, serialNumber: null },
        { ...input, serialNumber: 'x'.repeat(101) },
        ...[0, -1, 1.5, '1', null, 4294967296].map((orderId) => ({
          ...input,
          orderId,
        })),
        ...[
          -1,
          1.1,
          '1.001',
          '-1',
          '1e2',
          '10000000000',
          'NaN',
          '',
          '1,50',
          null,
        ].map((priceUSD) => ({ ...input, priceUSD })),
        { ...input, priceUAH: '1.001' },
        ...[
          '2026-02-29',
          '2026-02-31',
          '2026-13-01',
          '0001-01-01',
          '2026-10-01T00:00:00.000Z',
        ].map((warrantyStart) => ({ ...input, warrantyStart })),
        { ...input, warrantyEnd: '2026-02-31' },
        { ...input, isNew: 'false' },
        { ...input, isNew: null },
        { ...input, specification: null },
        { ...input, specification: 'x'.repeat(10001) },
        { ...input, photo: 'javascript:alert(1)' },
        { ...input, photo: 'https://user:password@example.com/a.jpg' },
        { ...input, id: 123 },
        { ...input, createdAt: '2020-01-01' },
      ];
      for (const body of invalidInputs) {
        await request(app.getHttpServer())
          .post('/api/products')
          .send(body)
          .expect(400);
      }
      expect(create).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });

  it('rejects reversed warranty dates without writing a product', async () => {
    const create = vi.fn();
    const app = await createApp({ product: { create } });
    try {
      await request(app.getHttpServer())
        .post('/api/products')
        .send({ ...input, warrantyEnd: '2025-01-01' })
        .expect(400);
      expect(create).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });

  it('returns a safe 500 response for unexpected database failures', async () => {
    const app = await createApp({
      product: {
        create: async () => {
          throw new Error('Private database details');
        },
      },
    });
    try {
      await request(app.getHttpServer())
        .post('/api/products')
        .send(input)
        .expect(500)
        .expect({ statusCode: 500, message: 'Internal server error' });
    } finally {
      await app.close();
    }
  });
});
