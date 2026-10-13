import '../config/environment.js';
import { Prisma, PrismaClient } from '../generated/prisma/client.js';
import { createDatabaseAdapter } from './prisma.adapter.js';

const prisma = new PrismaClient({ adapter: createDatabaseAdapter() });

const orders = [
  {
    id: 1,
    title: 'Office monitors delivery',
    description: 'Displays for the development team.',
    createdAt: new Date('2026-10-01T09:00:00.000Z'),
  },
  {
    id: 2,
    title: 'Peripherals and accessories',
    description: 'Keyboards and accessories for new workstations.',
    createdAt: new Date('2026-10-05T12:30:00.000Z'),
  },
  {
    id: 3,
    title: 'Pending delivery',
    description: 'An empty order for checking empty states.',
    createdAt: new Date('2026-10-10T08:15:00.000Z'),
  },
  {
    id: 4,
    title: 'Additional equipment for the second office and remote workstations',
    description: 'Mixed equipment and a long title for layout checks.',
    createdAt: new Date('2026-10-12T14:45:00.000Z'),
  },
] satisfies Prisma.OrderCreateManyInput[];

const products = [
  {
    id: 1001,
    orderId: 1,
    title: 'Dell UltraSharp U2723QE',
    type: 'Monitors',
    serialNumber: 'MON-0001',
    isNew: true,
    specification: '27-inch 4K display',
    priceUSD: '499.99',
    priceUAH: '20500.50',
  },
  {
    id: 1002,
    orderId: 1,
    title: 'LG 24MP400',
    type: 'Monitors',
    serialNumber: 'MON-0002',
    isNew: false,
    specification: '24-inch Full HD display',
    priceUSD: '149.95',
    priceUAH: '6150.25',
  },
  {
    id: 1003,
    orderId: 2,
    title: 'Logitech K380',
    type: 'Keyboards',
    serialNumber: 'KEY-0001',
    isNew: true,
    specification: 'Compact Bluetooth keyboard',
    priceUSD: '39.90',
    priceUAH: '1635.90',
  },
  {
    id: 1004,
    orderId: 2,
    title: 'USB-C adapter',
    type: 'Accessories',
    serialNumber: 'ACC-0001',
    isNew: true,
    specification: 'USB-C to USB-A adapter',
    priceUSD: '0.10',
    priceUAH: '4.10',
  },
  {
    id: 1005,
    orderId: 4,
    title: 'Keychron K2',
    type: 'Keyboards',
    serialNumber: 'KEY-0002',
    isNew: false,
    specification: 'Mechanical wireless keyboard',
    priceUSD: '89.00',
    priceUAH: '3649.00',
  },
  {
    id: 1006,
    orderId: 4,
    title: 'Adjustable laptop stand',
    type: 'Accessories',
    serialNumber: 'ACC-0002',
    isNew: true,
    specification: 'Aluminium desktop stand',
    priceUSD: '19.99',
    priceUAH: '819.59',
  },
].map((product) => ({
  ...product,
  photo: null,
  warrantyStart: new Date('2026-10-01T00:00:00.000Z'),
  warrantyEnd: new Date('2028-10-01T00:00:00.000Z'),
  createdAt: new Date('2026-10-12T14:45:00.000Z'),
})) satisfies Prisma.ProductCreateManyInput[];

try {
  await prisma.$transaction(async (transaction) => {
    await transaction.order.createMany({ data: orders, skipDuplicates: true });
    await transaction.product.createMany({
      data: products,
      skipDuplicates: true,
    });
  });
  console.log(
    'Development seed processed: 4 order fixtures and 6 product fixtures.',
  );
} finally {
  await prisma.$disconnect();
}
