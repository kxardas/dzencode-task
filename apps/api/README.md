# Orders & Products: API

NestJS backend with Prisma and MySQL. It serves the REST API under `/api` and the active-session counter over Socket.io on the same port (3001 by default).

For setting up the whole project, demo data, login and the endpoint list, see the [root README](../../README.md). This file covers what you need when working on the API itself. Commands below run inside `apps/api`.

## Running

MySQL should already be running and `.env` should exist (see [Running without Docker](../../README.md#running-without-docker)).

```bash
npm ci
npm run auth:setup   # first time only
npm run db:deploy
npm run db:seed      # optional demo data
npm run start:dev
```

Check that it works: http://localhost:3001/api/orders should return JSON. The bare `/api` path returns 404, which is expected.

The dev server compiles into `build/` and the production build into `dist/`. You can run `npm run build` or the integration tests while `start:dev` is running.

## Scripts

| Script | What it does |
| --- | --- |
| `start:dev` | Dev server with watch mode |
| `build` | Generate the Prisma client and compile to `dist/` |
| `start:prod` | Run `dist/` in production mode (requires an HTTPS `FRONTEND_URL`) |
| `test` | Unit tests, no database needed |
| `test:e2e` | Integration tests against MySQL from `.env`, plus Socket.io tests |
| `lint` | oxlint |
| `auth:setup` | Generate the login secret and password (see below) |
| `db:deploy` | Apply committed migrations |
| `db:migrate -- --name x` | Create a new migration (needs the shadow database) |
| `db:seed` | Add demo data. It's additive, so existing rows are kept. |
| `db:status`, `db:validate`, `db:studio` | Prisma helpers |
| `db:schema:export` | Regenerate `database/schema.sql` from the migrations |

## Code layout

```text
src/
  orders/      GET list/detail, DELETE with cascade
  products/    GET list/detail/filter, POST with DTO validation
  sessions/    Socket.io gateway for the tab counter
  auth/        login/logout/session, JWT cookie guard, write-origin guard
  prisma/      PrismaService, MySQL adapter, seed script
  config/      loads apps/api/.env
test/          integration tests (real MySQL and Socket.io)
prisma/        schema.prisma and migrations
scripts/       auth setup, schema export, Docker entrypoint
```

Controllers only map HTTP to service calls. Calculations (order totals, serialization of money and dates) live in the services. Services throw `NotFoundException` and similar, and unexpected database errors become a generic 500 without internal details.

## Data rules

- Money is `DECIMAL(12,2)` in MySQL and is sent as a string with two decimals (`"649.94"`). Totals are summed as decimals, not floats.
- Dates are UTC ISO strings. Warranty dates from the form are stored at UTC midnight.
- Deleting an order deletes its products through the foreign key cascade.
- `?type=` is an exact match on the whole value, case-insensitive because of the `utf8mb4_unicode_ci` collation.
- IDs must be integers from 1 to 4294967295 (unsigned INT). Anything else returns 400.

## Authentication

Reads and the socket are public. `POST /products` and `DELETE /orders/:id` need:

1. a valid JWT in the `inventory_session` HttpOnly cookie (set by `POST /auth/login`, valid for 15 minutes);
2. an `Origin` header equal to `FRONTEND_URL`;
3. the header `X-Inventory-Request: 1`.

Login and logout also check 2 and 3. The two headers act as simple CSRF protection: a foreign site can't send a custom header without a CORS preflight, and CORS only allows `FRONTEND_URL`.

`npm run auth:setup` creates a random password, stores its scrypt hash and a `JWT_SECRET` in `.env`, and writes the plain username and password to `.auth-local.json` (ignored by Git). It never overwrites existing credentials. The API won't start without `JWT_SECRET`, `DEMO_USERNAME` and `DEMO_PASSWORD_HASH`.

Auth is stateless on purpose. There's no session table, so logout only clears the cookie and a copied token stays valid until it expires. In production (`NODE_ENV=production`) the cookie is `Secure`, so the site must be served over HTTPS, with the API on the same origin behind a proxy.

## Sessions gateway

`SessionsGateway` keeps a `Set` of connected socket IDs. On every connect or disconnect it emits `sessions:count` with `{ count }` to all clients. Socket.io's heartbeat (25 s ping + 20 s timeout) removes clients that dropped without closing. The state is in memory, so it only works for a single API instance.

## Tests

- **Unit** (`npm test`): order totals, product serialization and creation rules, validation errors, auth config, the gateway counter.
- **Integration** (`npm run test:e2e`): real HTTP requests to the compiled app and a real MySQL database. Test data is created inside transactions that are rolled back at the end, so your data stays untouched. Socket.io tests start their own server without a database and use real polling and WebSocket clients.

`test:e2e` builds the app first, so the first run takes a little longer.

## Docker

The image compiles the app and runs as the non-root `node` user. On start, `scripts/docker-entrypoint.sh` runs `prisma migrate deploy` and then the API. If a migration fails, the API doesn't start. Seeding is never automatic. Use `docker compose exec api npx prisma db seed`.

`scripts/setup-auth.mjs` accepts an output directory. Compose uses this to write credentials into `.docker/` on the host instead of into the image. Docker commands are in the [root README](../../README.md#quick-start-with-docker).
