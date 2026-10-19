# Orders & Products — API

NestJS ESM backend with Prisma 7.10.0 and MySQL 8.4.11. The Prisma module
connects on startup and disconnects during shutdown. `GET /api/orders`
returns order summaries, product counts, and decimal totals in both currencies.
`GET /api/orders/:id` returns one order with its associated product details;
missing orders return 404 and invalid IDs return 400.
`DELETE /api/orders/:id` deletes the order and its products and returns
204 with no body. Other orders remain intact; missing or already deleted
orders return 404, and invalid IDs return 400.

`GET /api/products` lists all products with `order: { id, title }`.
`GET /api/products?type=Monitors` filters by the whole type value, following
MySQL's case/accent insensitive collation. Blank filters show all products;
unknown types return an empty array. `GET /api/products/:id` returns one
product. Both routes serialize money and dates consistently with order
details; invalid IDs/queries return 400 and missing products return 404.

`POST /api/products` creates a product for an existing order and returns 201
with `{ data: product }`. DTO validation trims strings and checks field lengths,
real warranty dates, decimal-string prices, boolean values, and unknown fields.
The service checks warranty ordering and maps a missing parent order to 404.
Dates are stored at UTC midnight; monetary inputs remain exact decimals.
See the [Products API](../../README.md#products-api) for input constraints.

Follow the [root setup guide](../../README.md) to start MySQL and configure
`apps/api/.env`. The commands below run inside `apps/api`.

## Development

```bash
npm ci
npm run auth:setup
npm run db:deploy
npm run db:seed
npm run start:dev
```

The API defaults to port 3001 and the `/api` prefix. It loads this directory's
`.env`, reads `FRONTEND_URL` for CORS, and requires a working `DATABASE_URL`.
Open http://localhost:3001/api/orders to inspect the JSON response. The bare
`/api` path returns 404. Socket.io shares the HTTP port, using `/socket.io`
and the root namespace. `SessionsModule` broadcasts `sessions:count` with
`{ count: number }` on connection/disconnection. Each socket ID counts once;
counts are kept in memory for one API instance. CORS uses `FRONTEND_URL`.
No client messages or authentication are required for this public counter.
See the [session behavior](../../README.md#clock-and-active-sessions).

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
HTTP integration tests use compiled NestJS modules, so `test:e2e` builds first.

Watch/debug mode uses `tsconfig.dev.json` and writes to `build/`, including its
incremental compiler cache. Production builds and HTTP integration tests use
`dist/`. These separate outputs allow `npm run build` to run without deleting
files used by an active dev server. Both output directories are ignored by Git.
`npm run start:prod` sets production mode through a small portable launcher and
loads `dist/main.js`. It requires an HTTPS `FRONTEND_URL` and production credentials;
use `start:dev` for local HTTP development.

Unit tests validate connection configuration, order-summary calculations,
product serialization/creation, defaults, warranty ordering, and error handling.
Integration tests verify the list route's JSON format, empty collections,
stable ordering, order details, populated/empty order deletion, preservation
of other orders and products, repeated deletion, ID validation, missing orders, and generic
server errors, along with actual
MySQL relationships, filtering, decimals, UTC dates, cascading deletion, foreign
keys, and CHECK constraints. They require a running, migrated database and
roll back test writes. Products HTTP tests cover filtering/reset, ordering,
order associations, serialization, empty results, validation, errors, and
the disappearance of products after cascading order deletion.
Creation tests cover real MySQL writes and returned values, exact order totals,
duplicate serial numbers, deleted-parent handling, invalid input, and safe
server errors. Test-created records are rolled back. Session unit tests check
count updates, duplicate/disconnection handling, and reconnecting socket IDs.
Socket.io integration tests use real polling/WebSocket clients and an isolated
Nest server without a database to verify connection, closure, refresh, and
automatic reconnection.
The current suite has 28 unit tests, 28 database/HTTP integration tests,
and two Socket.io integration tests.

## Authentication

Inventory reads and sockets are public. `POST /api/products` and
`DELETE /api/orders/:id` require a valid JWT cookie plus the exact configured
`Origin` and `X-Inventory-Request: 1`. A dedicated AuthModule owns login/session/
logout endpoints, password verification, JWT validation, and guards.

Run `npm run auth:setup` once to generate private local settings and evaluator
access in ignored `.auth-local.json`. Existing secrets are preserved. The API
requires `JWT_SECRET`, `DEMO_USERNAME`, and `DEMO_PASSWORD_HASH` on startup.
For production configure `NODE_ENV=production`, HTTPS, fresh credentials, and
same-site web/API hosting. The cookie is HttpOnly, SameSite=Lax, fifteen minutes,
and Secure in production. Logout clears the browser cookie. JWTs remain valid
until expiry, including across API restarts; there is no server session registry.
There is no registration, login limiter, or refresh-token flow.

See [authentication and evaluator access](../../README.md#authentication-and-evaluator-access) for the
request contract, password hashing, environment, and deployment constraints.
Auth tests exercise valid/invalid login, cookie flags, actual expiry, protected
writes, trusted write headers, cookie clearing, and stateless restart behavior.

The storage model is in `prisma/schema.prisma`; API contracts are in the root README.
