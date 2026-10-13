# Orders & Products — API

NestJS ESM backend with Prisma 7.10.0 and MySQL 8.4.11. The Prisma module
connects on startup and disconnects during shutdown. HTTP endpoints are not
implemented yet.

Follow the [root setup guide](../../README.md) to start MySQL and configure
`apps/api/.env`. The commands below run inside `apps/api`.

## Development

```bash
npm ci
npm run db:deploy
npm run db:seed
npm run start:dev
```

The API defaults to port 3001 and the `/api` prefix. It loads this directory's
`.env`, reads `FRONTEND_URL` for CORS, and requires a working `DATABASE_URL`.
A 404 at `/api` is expected until application routes are implemented.

## Database and checks

```bash
npm run db:validate
npm run db:generate
npm run db:migrate -- --name describe_the_change
npm run db:status
npm run db:schema:export
npm run lint
npm test
npm run test:e2e
npm run build
```

`db:migrate` requires the separate shadow database initialized by the local
MySQL image. `db:deploy` applies existing migrations without creating new ones.
`db:seed` builds and runs the additive development seed; existing rows are not
overwritten. Build and test commands regenerate the ignored Prisma client.

Unit tests validate connection configuration. Integration tests verify actual
MySQL relationships, filtering, decimals, UTC dates, cascading deletion, foreign
keys, and CHECK constraints. They require a running, migrated database and
roll back test writes. Business endpoint and validation-form tests will be
added with their respective features.

See [data decisions and planned contracts](../../docs/data-contracts.md).
