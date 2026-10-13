import { readdir, readFile, writeFile } from 'node:fs/promises';

const migrationsDirectory = new URL('../prisma/migrations/', import.meta.url);
const migrations = (await readdir(migrationsDirectory, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const statements = [];
for (const migration of migrations) {
  statements.push(
    await readFile(
      new URL(`${migration}/migration.sql`, migrationsDirectory),
      'utf8',
    ),
  );
}

const header = `-- Reference schema for MySQL Workbench.
-- Generated from committed Prisma migrations; application setup uses Prisma Migrate.

CREATE DATABASE IF NOT EXISTS \`orders_products\`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`orders_products\`;

`;

await writeFile(
  new URL('../../../database/schema.sql', import.meta.url),
  header + statements.join('\n'),
);
console.log(
  `Exported ${migrations.length} migration(s) to database/schema.sql.`,
);
