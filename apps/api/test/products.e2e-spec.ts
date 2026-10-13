import '../src/config/environment.js';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../dist/app.module.js';
import { PrismaService } from '../dist/prisma/prisma.service.js';
import { PrismaClient } from '../src/generated/prisma/client.js';
import type { ProductResponse } from '../src/products/products.service.js';
import { createDatabaseAdapter } from '../src/prisma/prisma.adapter.js';

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

describe('Products HTTP API', () => {
  it('lists and filters MySQL products with correct associations, formatting, and ordering', async () => {
    const prisma = new PrismaClient({ adapter: createDatabaseAdapter() });
    const rollback = new Error('Roll back product HTTP test fixtures');

    try {
      await prisma.$transaction(async (transaction) => {
        const firstOrder = await transaction.order.create({
          data: { title: 'First product HTTP test order', description: '' },
        });
        const secondOrder = await transaction.order.create({
          data: { title: 'Second product HTTP test order', description: '' },
        });
        const type = `HTTP-Monitors-${firstOrder.id}`;
        const base = {
          title: 'HTTP test monitor',
          type,
          serialNumber: '0001',
          isNew: false,
          photo: null,
          specification: 'Full HD',
          warrantyStart: new Date('2026-10-01T00:00:00.000Z'),
          warrantyEnd: new Date('2028-10-01T00:00:00.000Z'),
          priceUSD: '0.10',
          priceUAH: '4.10',
          createdAt: new Date('2026-10-13T12:00:00.123Z'),
        };
        const first = await transaction.product.create({
          data: { ...base, orderId: firstOrder.id },
        });
        const second = await transaction.product.create({
          data: {
            ...base,
            orderId: secondOrder.id,
            isNew: true,
            photo: '/images/monitor.jpg',
          },
        });
        const accessory = await transaction.product.create({
          data: {
            ...base,
            orderId: secondOrder.id,
            type: `${type}-Accessories`,
            createdAt: new Date('2026-10-14T12:00:00.123Z'),
          },
        });
        const app = await createApp({ product: transaction.product });

        try {
          const list = await request(app.getHttpServer())
            .get('/api/products')
            .expect(200);
          const { data } = list.body as { data: ProductResponse[] };
          const expected = {
            id: first.id,
            orderId: firstOrder.id,
            ...base,
            warrantyStart: '2026-10-01T00:00:00.000Z',
            warrantyEnd: '2028-10-01T00:00:00.000Z',
            createdAt: '2026-10-13T12:00:00.123Z',
            order: { id: firstOrder.id, title: firstOrder.title },
          };
          expect(data.find((product) => product.id === first.id)).toEqual(
            expected,
          );
          expect(
            data.find((product) => product.id === second.id),
          ).toMatchObject({
            orderId: secondOrder.id,
            order: { id: secondOrder.id, title: secondOrder.title },
            isNew: true,
            photo: '/images/monitor.jpg',
          });
          const positions = [accessory, second, first].map((fixture) =>
            data.findIndex((product) => product.id === fixture.id),
          );
          expect(positions[0]).toBeLessThan(positions[1]);
          expect(positions[1]).toBeLessThan(positions[2]);

          await request(app.getHttpServer())
            .get(`/api/products/${first.id}`)
            .expect(200)
            .expect({ data: expected });
          const filtered = await request(app.getHttpServer())
            .get('/api/products')
            .query({ type: ` ${type.toLowerCase()} ` })
            .expect(200);
          expect(filtered.body).toEqual({
            data: data.filter((product) => product.type === type),
          });
          expect(filtered.body.data).toHaveLength(2);
          await request(app.getHttpServer())
            .get('/api/products')
            .query({ type: `${type}-Missing` })
            .expect(200)
            .expect({ data: [] });
          for (const emptyType of ['', '   ']) {
            await request(app.getHttpServer())
              .get('/api/products')
              .query({ type: emptyType })
              .expect(200)
              .expect({ data });
          }

          await transaction.order.delete({ where: { id: firstOrder.id } });
          await request(app.getHttpServer())
            .get(`/api/products/${first.id}`)
            .expect(404);
          const remaining = await request(app.getHttpServer())
            .get('/api/products')
            .query({ type })
            .expect(200);
          expect(
            remaining.body.data.map((product: ProductResponse) => product.id),
          ).toEqual([second.id]);
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

  it('returns an empty array when there are no products', async () => {
    const app = await createApp({ product: { findMany: async () => [] } });
    try {
      await request(app.getHttpServer())
        .get('/api/products')
        .expect(200)
        .expect({ data: [] });
    } finally {
      await app.close();
    }
  });

  it('returns 404 for a missing product', async () => {
    const app = await createApp({ product: { findUnique: async () => null } });
    try {
      await request(app.getHttpServer())
        .get('/api/products/4294967295')
        .expect(404)
        .expect({
          statusCode: 404,
          message: 'Product 4294967295 not found',
          error: 'Not Found',
        });
    } finally {
      await app.close();
    }
  });

  it('rejects invalid IDs and query values before querying the database', async () => {
    const findMany = vi.fn();
    const findUnique = vi.fn();
    const app = await createApp({ product: { findMany, findUnique } });
    try {
      for (const id of [
        'abc',
        '0',
        '-1',
        '1.5',
        '4294967296',
        '9007199254740993',
      ]) {
        await request(app.getHttpServer())
          .get(`/api/products/${id}`)
          .expect(400);
      }
      for (const query of [
        { type: 'x'.repeat(101) },
        { type: ['Monitors', 'Keyboards'] },
        { unsupported: 'value' },
      ]) {
        await request(app.getHttpServer())
          .get('/api/products')
          .query(query)
          .expect(400);
      }
      expect(findMany).not.toHaveBeenCalled();
      expect(findUnique).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });

  it('does not expose internal database errors', async () => {
    const fail = async () => {
      throw new Error('Private connection details');
    };
    const app = await createApp({
      product: { findMany: fail, findUnique: fail },
    });
    try {
      for (const path of ['/api/products', '/api/products/1']) {
        await request(app.getHttpServer())
          .get(path)
          .expect(500)
          .expect({ statusCode: 500, message: 'Internal server error' });
      }
    } finally {
      await app.close();
    }
  });
});
