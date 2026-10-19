import '../src/config/environment.js';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AUTH_CONFIG } from '../dist/auth/auth.config.js';
import {
  testAuthConfig,
  authenticateApp,
  authenticatedRequest,
} from './auth-helpers.js';
import { AppModule } from '../dist/app.module.js';
import { PrismaService } from '../dist/prisma/prisma.service.js';
import { PrismaClient } from '../src/generated/prisma/client.js';
import type {
  OrderDetails,
  OrderSummary,
} from '../src/orders/orders.service.js';
import { createDatabaseAdapter } from '../src/prisma/prisma.adapter.js';

async function createApp(database: unknown): Promise<INestApplication> {
  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(AUTH_CONFIG)
    .useValue(testAuthConfig)
    .overrideProvider(PrismaService)
    .useValue(database)
    .compile();
  const app = module.createNestApplication({ logger: false });
  app.setGlobalPrefix('api');
  await app.init();
  await authenticateApp(app);
  return app;
}

describe('Orders HTTP API', () => {
  it('returns summaries and associated product details from MySQL without changing existing records', async () => {
    const prisma = new PrismaClient({ adapter: createDatabaseAdapter() });
    const rollback = new Error('Roll back HTTP test fixtures');

    try {
      await prisma.$transaction(async (transaction) => {
        const createdAt = new Date('2026-10-13T12:00:00.123Z');
        const populated = await transaction.order.create({
          data: {
            title: 'HTTP test order',
            description: 'Two products',
            createdAt,
          },
        });
        const empty = await transaction.order.create({
          data: { title: 'Empty HTTP test order', description: '', createdAt },
        });
        await transaction.product.createMany({
          data: ['0.10', '0.20'].map((priceUSD, index) => ({
            orderId: populated.id,
            title: `HTTP test product ${index + 1}`,
            type: 'Monitors',
            serialNumber: `HTTP-TEST-${index + 1}`,
            isNew: index === 0,
            photo: index === 0 ? '/images/products/monitor.jpg' : null,
            specification: '',
            warrantyStart: new Date('2026-10-01T00:00:00.000Z'),
            warrantyEnd: new Date('2028-10-01T00:00:00.000Z'),
            priceUSD,
            priceUAH: index === 0 ? '4.10' : '8.20',
            createdAt,
          })),
        });

        const app = await createApp({ order: transaction.order });
        try {
          const response = await authenticatedRequest(app)
            .get('/api/orders')
            .expect(200);
          const { data } = response.body as { data: OrderSummary[] };
          expect(data.find((order) => order.id === populated.id)).toEqual({
            id: populated.id,
            title: 'HTTP test order',
            description: 'Two products',
            createdAt: '2026-10-13T12:00:00.123Z',
            productCount: 2,
            totalUSD: '0.30',
            totalUAH: '12.30',
          });
          expect(data.find((order) => order.id === empty.id)).toEqual({
            id: empty.id,
            title: 'Empty HTTP test order',
            description: '',
            createdAt: '2026-10-13T12:00:00.123Z',
            productCount: 0,
            totalUSD: '0.00',
            totalUAH: '0.00',
          });
          expect(data.findIndex((order) => order.id === empty.id)).toBeLessThan(
            data.findIndex((order) => order.id === populated.id),
          );

          const details = await authenticatedRequest(app)
            .get(`/api/orders/${populated.id}`)
            .expect(200);
          const { data: order } = details.body as { data: OrderDetails };
          const { products, ...summary } = order;
          expect(summary).toEqual(
            data.find((item) => item.id === populated.id),
          );
          expect(products).toHaveLength(2);
          expect(products[0].id).toBeGreaterThan(products[1].id);
          for (const [position, product] of products.entries()) {
            const index = 1 - position;
            expect(product).toEqual({
              id: expect.any(Number),
              orderId: populated.id,
              title: `HTTP test product ${index + 1}`,
              type: 'Monitors',
              serialNumber: `HTTP-TEST-${index + 1}`,
              isNew: index === 0,
              photo: index === 0 ? '/images/products/monitor.jpg' : null,
              specification: '',
              warrantyStart: '2026-10-01T00:00:00.000Z',
              warrantyEnd: '2028-10-01T00:00:00.000Z',
              priceUSD: index === 0 ? '0.10' : '0.20',
              priceUAH: index === 0 ? '4.10' : '8.20',
              createdAt: '2026-10-13T12:00:00.123Z',
            });
          }

          await authenticatedRequest(app)
            .get(`/api/orders/${empty.id}`)
            .expect(200)
            .expect({
              data: {
                ...data.find((item) => item.id === empty.id),
                products: [],
              },
            });
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

  it('returns an empty data array when the database has no orders', async () => {
    const app = await createApp({ order: { findMany: async () => [] } });
    try {
      await authenticatedRequest(app)
        .get('/api/orders')
        .expect(200)
        .expect({ data: [] });
    } finally {
      await app.close();
    }
  });

  it('deletes populated and empty orders, cascades products, and preserves other orders', async () => {
    const prisma = new PrismaClient({ adapter: createDatabaseAdapter() });
    const rollback = new Error('Roll back deletion HTTP test fixtures');
    const product = {
      title: 'Deletion test product',
      type: 'Monitors',
      serialNumber: 'DELETE-TEST',
      specification: '',
      warrantyStart: new Date('2026-10-01T00:00:00.000Z'),
      warrantyEnd: new Date('2028-10-01T00:00:00.000Z'),
      priceUSD: '1.00',
      priceUAH: '41.00',
    };

    try {
      await prisma.$transaction(async (transaction) => {
        const deleted = await transaction.order.create({
          data: {
            title: 'Deleted HTTP test order',
            description: '',
            products: { create: [product, product] },
          },
          include: { products: true },
        });
        const retained = await transaction.order.create({
          data: {
            title: 'Retained HTTP test order',
            description: '',
            products: { create: product },
          },
          include: { products: true },
        });
        const empty = await transaction.order.create({
          data: { title: 'Empty deletion HTTP test order', description: '' },
        });
        const app = await createApp({ order: transaction.order });

        try {
          const response = await authenticatedRequest(app)
            .delete(`/api/orders/${deleted.id}`)
            .expect(204);
          expect(response.text).toBe('');
          expect(
            await transaction.order.findUnique({ where: { id: deleted.id } }),
          ).toBeNull();
          expect(
            await transaction.product.count({ where: { orderId: deleted.id } }),
          ).toBe(0);
          expect(
            await transaction.order.findUnique({
              where: { id: retained.id },
              include: { products: true },
            }),
          ).toEqual(retained);

          await authenticatedRequest(app)
            .get(`/api/orders/${deleted.id}`)
            .expect(404);
          await authenticatedRequest(app)
            .delete(`/api/orders/${deleted.id}`)
            .expect(404);

          const list = await authenticatedRequest(app)
            .get('/api/orders')
            .expect(200);
          const { data } = list.body as { data: OrderSummary[] };
          expect(data.some((order) => order.id === deleted.id)).toBe(false);
          expect(data.some((order) => order.id === retained.id)).toBe(true);

          const emptyResponse = await authenticatedRequest(app)
            .delete(`/api/orders/${empty.id}`)
            .expect(204);
          expect(emptyResponse.text).toBe('');
          await authenticatedRequest(app)
            .get(`/api/orders/${empty.id}`)
            .expect(404);
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

  it('does not expose database details in a server error response', async () => {
    const fail = async () => {
      throw new Error('Private database connection details');
    };
    const app = await createApp({
      order: { findMany: fail, findUnique: fail, deleteMany: fail },
    });
    try {
      for (const path of ['/api/orders', '/api/orders/1']) {
        const response = await authenticatedRequest(app).get(path).expect(500);
        expect(response.body).toEqual({
          statusCode: 500,
          message: 'Internal server error',
        });
      }
      await authenticatedRequest(app)
        .delete('/api/orders/1')
        .expect(500)
        .expect({ statusCode: 500, message: 'Internal server error' });
    } finally {
      await app.close();
    }
  });

  it('returns 404 for a valid ID that does not exist', async () => {
    const findUnique = vi.fn().mockResolvedValue(null);
    const deleteMany = vi.fn().mockResolvedValue({ count: 0 });
    const app = await createApp({ order: { findUnique, deleteMany } });
    try {
      await authenticatedRequest(app)
        .get('/api/orders/4294967295')
        .expect(404)
        .expect({
          statusCode: 404,
          message: 'Order 4294967295 not found',
          error: 'Not Found',
        });
      await authenticatedRequest(app)
        .delete('/api/orders/4294967295')
        .expect(404)
        .expect({
          statusCode: 404,
          message: 'Order 4294967295 not found',
          error: 'Not Found',
        });
    } finally {
      await app.close();
    }
  });

  it('rejects invalid IDs before querying the database', async () => {
    const findUnique = vi.fn();
    const deleteMany = vi.fn();
    const app = await createApp({ order: { findUnique, deleteMany } });
    try {
      for (const id of [
        'abc',
        '0',
        '-1',
        '1.5',
        '4294967296',
        '9007199254740993',
      ]) {
        const response = await authenticatedRequest(app)
          .get(`/api/orders/${id}`)
          .expect(400);
        expect(response.body.message).toEqual(expect.any(Array));
        expect(response.body.error).toBe('Bad Request');
        await authenticatedRequest(app).delete(`/api/orders/${id}`).expect(400);
      }
      expect(findUnique).not.toHaveBeenCalled();
      expect(deleteMany).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });
});
