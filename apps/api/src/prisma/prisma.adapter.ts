import { PrismaMariaDb } from '@prisma/adapter-mariadb';

export function createDatabaseAdapter(
  databaseUrl = process.env.DATABASE_URL,
): PrismaMariaDb {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required. Configure apps/api/.env.');
  }

  let connection: URL;
  try {
    connection = new URL(databaseUrl);
  } catch {
    throw new Error('DATABASE_URL must be a valid MySQL connection URL.');
  }

  if (
    connection.protocol !== 'mysql:' ||
    !connection.hostname ||
    !connection.username ||
    !connection.pathname.slice(1)
  ) {
    throw new Error(
      'DATABASE_URL must specify a MySQL host, user, and database.',
    );
  }

  if (connection.search || connection.hash) {
    throw new Error(
      'DATABASE_URL query parameters are not supported; configure driver options explicitly.',
    );
  }

  return new PrismaMariaDb({
    host: connection.hostname,
    port: Number(connection.port || 3306),
    user: decodeURIComponent(connection.username),
    password: decodeURIComponent(connection.password),
    database: decodeURIComponent(connection.pathname.slice(1)),
    connectionLimit: 5,
    connectTimeout: 5_000,
    acquireTimeout: 10_000,
    timezone: 'Z',
  });
}
