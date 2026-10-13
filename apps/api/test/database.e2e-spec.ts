import '../src/config/environment.js';
import { Prisma, PrismaClient } from '../src/generated/prisma/client.js';
import { createDatabaseAdapter } from '../src/prisma/prisma.adapter.js';

let prisma: PrismaClient;

// Successful test writes are rolled back as well as writes before a failure.
async function withRollback(
  verify: (transaction: Prisma.TransactionClient) => Promise<void>,
): Promise<void> {
  const rollback = new Error('Roll back database test');
  try {
    await prisma.$transaction(async (transaction) => {
      await verify(transaction);
      throw rollback;
    });
  } catch (error) {
    if (error !== rollback) throw error;
  }
}

function productData(
  orderId: number,
  overrides: Partial<Prisma.ProductUncheckedCreateInput> = {},
): Prisma.ProductUncheckedCreateInput {
  return {
    orderId,
    title: 'Database test product',
    type: 'Monitors',
    serialNumber: 'TEST-001',
    isNew: true,
    photo: null,
    specification: 'Integration test fixture',
    warrantyStart: new Date('2026-10-01T00:00:00.000Z'),
    warrantyEnd: new Date('2028-10-01T00:00:00.000Z'),
    priceUSD: '0.10',
    priceUAH: '4.10',
    createdAt: new Date('2026-10-13T12:00:00.123Z'),
    ...overrides,
  };
}

describe('MySQL persistence', () => {
  beforeAll(async () => {
    prisma = new PrismaClient({ adapter: createDatabaseAdapter() });
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  it('keeps order associations and filters products by type', async () => {
    await withRollback(async (transaction) => {
      const first = await transaction.order.create({
        data: { title: 'First test order', description: '' },
      });
      const second = await transaction.order.create({
        data: { title: 'Second test order', description: '' },
      });
      await transaction.product.create({ data: productData(first.id) });
      await transaction.product.create({
        data: productData(first.id, { type: 'Keyboards' }),
      });
      await transaction.product.create({ data: productData(second.id) });

      const order = await transaction.order.findUniqueOrThrow({
        where: { id: first.id },
        include: { products: true },
      });
      expect(order.products).toHaveLength(2);
      expect(
        order.products.every((product) => product.orderId === first.id),
      ).toBe(true);
      const keyboards = await transaction.product.findMany({
        where: { orderId: first.id, type: 'Keyboards' },
      });
      expect(keyboards).toHaveLength(1);
      expect(keyboards[0].type).toBe('Keyboards');
      const absentType = await transaction.product.findMany({
        where: { orderId: first.id, type: 'Nonexistent type' },
      });
      expect(absentType).toEqual([]);
    });
  });

  it('preserves decimal precision and UTC dates with milliseconds', async () => {
    await withRollback(async (transaction) => {
      const order = await transaction.order.create({
        data: { title: 'Decimal test order', description: '' },
      });
      const first = await transaction.product.create({
        data: productData(order.id),
      });
      const second = await transaction.product.create({
        data: productData(order.id, { priceUSD: '0.20', priceUAH: '8.20' }),
      });
      expect(first.priceUSD.plus(second.priceUSD).toFixed(2)).toBe('0.30');
      expect(first.priceUAH.plus(second.priceUAH).toFixed(2)).toBe('12.30');
      expect(first.createdAt.toISOString()).toBe('2026-10-13T12:00:00.123Z');
      expect(first.warrantyStart.toISOString()).toBe(
        '2026-10-01T00:00:00.000Z',
      );
    });
  });

  it('deletes only the products belonging to a deleted order', async () => {
    await withRollback(async (transaction) => {
      const deleted = await transaction.order.create({
        data: { title: 'Deleted test order', description: '' },
      });
      const retained = await transaction.order.create({
        data: { title: 'Retained test order', description: '' },
      });
      const removedProduct = await transaction.product.create({
        data: productData(deleted.id),
      });
      const retainedProduct = await transaction.product.create({
        data: productData(retained.id),
      });
      await transaction.order.delete({ where: { id: deleted.id } });
      expect(
        await transaction.product.findUnique({
          where: { id: removedProduct.id },
        }),
      ).toBeNull();
      expect(
        await transaction.product.findUnique({
          where: { id: retainedProduct.id },
        }),
      ).not.toBeNull();
    });
  });

  it('rejects a product referencing a missing order', async () => {
    await withRollback(async (transaction) => {
      const order = await transaction.order.create({
        data: { title: 'Foreign-key test order', description: '' },
      });
      await transaction.order.delete({ where: { id: order.id } });
      await expect(
        transaction.product.create({ data: productData(order.id) }),
      ).rejects.toMatchObject({ code: 'P2003' });
    });
  });

  it('rejects negative prices and reversed warranty dates', async () => {
    await withRollback(async (transaction) => {
      const order = await transaction.order.create({
        data: { title: 'Constraint test order', description: '' },
      });
      for (const override of [
        { priceUSD: '-0.01' },
        { priceUAH: '-0.01' },
        { warrantyEnd: new Date('2025-10-01T00:00:00.000Z') },
      ]) {
        await expect(
          transaction.product.create({ data: productData(order.id, override) }),
        ).rejects.toThrow();
      }
      expect(
        await transaction.product.count({ where: { orderId: order.id } }),
      ).toBe(0);
    });
  });
});
