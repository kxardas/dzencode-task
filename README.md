# Orders & Products

A full-stack inventory management application developed for the dZENcode
Junior+ React.js technical assessment.

## Current status

The database foundation is implemented: MySQL, Prisma models and migrations,
development seed data, and a NestJS Prisma module with connection lifecycle
management. `GET /api/orders` returns order summaries with product counts and
decimal totals in USD/UAH. `GET /api/orders/:id` returns one order with its
associated products. `DELETE /api/orders/:id` deletes the order and its
products. Products list, type filtering, and detail endpoints are implemented.
The frontend has a shared header/sidebar layout. Orders and Products server-render
real inventory and initialize RTK Query for subsequent updates, with loading,
empty, error, and retry states. Products displays
all inventory with type filtering, warranty dates, USD/UAH prices, and associated
order titles. Selecting an order opens a closable panel with its products.
Order deletion requires confirmation, handles pending/error states, updates the
cached list, and closes the deleted order's panel. A validated create-product
form is available within a selected order's panel. The shared header displays
the browser's local date/time and a server-maintained active-tab counter.
The header offers Russian/Ukrainian UI languages and remembers the choice locally.

The frontend root redirects to `/orders`; `/products` is available through
the menu. Orders shows names, counts, dates, and totals from the API. The API connects to MySQL
on startup. Open `/api/orders` for JSON data; the bare `/api` path returns 404.

See [TODO.md](TODO.md) for progress and
[data decisions and planned contracts](docs/data-contracts.md) for the model,
currencies, UTC dates, deletion policy, and intended API responses.

## Technology stack

- **Frontend:** Next.js App Router, React, TypeScript, Redux Toolkit/RTK Query.
  Socket.io Client receives live session counts. Bootstrap 5,
  SCSS with BEM, and Lucide React are used by the shared frontend layout.
- **Backend:** NestJS with ESM and TypeScript, Prisma 7.10.0 and its MySQL driver
  adapter, DTO validation, and a Socket.io gateway for active sessions.
- **Database:** MySQL 8.4.11, Prisma migrations, and decimal monetary columns.
- **Testing:** Backend Vitest unit tests, MySQL integration tests, and real
  Socket.io client tests. Frontend Vitest and React Testing Library tests use
  mocked fetch responses and socket events.
- **Infrastructure:** Docker Compose runs MySQL locally. Web/API containers
  and production deployment are planned.

## Repository structure

```text
apps/
  web/                  Next.js frontend
  api/
    prisma/             Schema and migrations
    src/prisma/         NestJS module, service, adapter, and development seed
    scripts/            MySQL schema export
    test/               Database integration tests
    prisma.config.ts    CLI connection and migration configuration
database/              MySQL image setup and Workbench schema.sql
docs/                  Data decisions and planned API contracts
task/                  Original assignment, example data, and UI references
TODO.md                Development and delivery checklist
.nvmrc                 Pinned Node.js version
docker-compose.yml     Local MySQL service
```

Each application has its own npm manifest and lockfile. Run commands inside
that application or use `npm --prefix` as below, from the repository root.

## Prerequisites

- Node.js **26.7.0**, pinned in `.nvmrc` and used for verification.
- npm **11.19.0**, declared in the application manifests.
- Git.
- Docker with Docker Compose and a running Docker engine.
- Local ports 3000 (frontend), 3001 (API), and 3306 (MySQL) available.

If using nvm, select the pinned version from the repository root:

```bash
nvm install
nvm use
```

## Local development from scratch

Clone the repository, install dependencies, and copy the example configuration.
Copy the examples only during initial setup; preserve any existing local values.

```bash
git clone https://github.com/kxardas/dzencode-task.git
cd dzencode-task
npm --prefix apps/web ci
npm --prefix apps/api ci
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Start MySQL, apply committed migrations, and insert optional demo data:

```bash
docker compose up -d --build --wait --wait-timeout 180 mysql
npm --prefix apps/api run db:deploy
npm --prefix apps/api run db:seed
```

The seed inserts four orders and six products of three types. Order 3 is empty.
Repeating the seed does not duplicate, delete, or overwrite existing rows.
Skip seeding if you need an empty database.

Start the API and frontend in separate terminals:

```bash
npm --prefix apps/api run start:dev
```

The API watcher writes to `apps/api/build/`; production builds and HTTP tests
use `apps/api/dist/`. A production build therefore does not clear the running
dev server's compiled files.

```bash
npm --prefix apps/web run dev
```

Open http://localhost:3000 to view order summaries fetched from the API. Use the menu
to switch to Products without a full-page reload. The shared layout adapts
to mobile screens. Order panels show product titles, serial numbers, placeholder
icons, and new/used condition. Products offers a type select with a reset option,
loading/error handling, and empty results. The header shows the local date/time
and active connected tabs.
The API listens on http://localhost:3001 with the `/api` prefix. Open
http://localhost:3001/api/orders to view order summaries. The bare `/api` path
and other unimplemented routes return 404. CORS uses `FRONTEND_URL`.

Orders and Products fetch initial inventory on the Next.js server for each request and
includes it in streamed HTML. The browser initializes the RTK Query cache from
that data without repeating the initial list request. Later mutations and
refreshes still use RTK Query. Existing client data takes precedence over reused
route payloads. If the server-side API request fails, client fetching and retry
remain available. Product type filtering and selected order details load in the browser.
Successful inventory mutations also prevent an older prefetched Products payload
from overwriting current data, including on the first visit to Products.

## Orders API

```bash
curl http://localhost:3001/api/orders
```

The response is `{ "data": [...] }`, ordered by creation date descending,
then ID descending when dates match. Each summary contains an ID, title,
description, UTC creation date, product count, and total value in each currency.
For example, the first seeded order appears in the array as:

```json
{
  "id": 1,
  "title": "Office monitors delivery",
  "description": "Displays for the development team.",
  "createdAt": "2026-10-01T09:00:00.000Z",
  "productCount": 2,
  "totalUSD": "649.94",
  "totalUAH": "26650.75"
}
```

Prices are decimal strings with two fractional digits. Empty orders have
zero products and totals of `"0.00"`; no orders returns `{ "data": [] }`.

To retrieve one order and its products:

```bash
curl http://localhost:3001/api/orders/1
```

The response is `{ "data": { ...summary, "products": [...] } }`. Products
include their IDs, order ID, title, type, serial number, new/used flag,
nullable photo URL, specification, warranty dates, both prices, and creation
date. Dates use UTC ISO strings and prices have two fractional digits.
Products are sorted by creation date descending, then ID descending.
An empty order returns `products: []` with zero counts and totals.
A missing order returns 404. The ID must be an integer between 1 and
4294967295 (the database's unsigned integer range); invalid IDs return 400.

`DELETE /api/orders/:id` removes an order and all its associated products.
Successful deletion returns `204 No Content` with no response body. Other
orders and their products are preserved. A missing or already deleted order
returns 404, and invalid IDs return 400. Database failures return a generic
500 response without internal details.

The frontend dialog explains that associated products will be deleted and
sends DELETE only after confirmation. Pending requests disable dismissal and
duplicate submissions. Errors keep the dialog open for retry. On success,
the deleted order and its products are removed from cached lists, affected order
and product queries are invalidated, and its selected panel closes. Other selected
orders remain open.

## Products API

```bash
curl http://localhost:3001/api/products
curl 'http://localhost:3001/api/products?type=Monitors'
curl http://localhost:3001/api/products/1001
```

List responses use `{ "data": [...] }`; a detail response uses
`{ "data": { ...product } }`. Each product includes all fields described
above and `order: { id, title }` identifying its associated order. Prices are
decimal strings with two fractional digits and dates are UTC ISO strings.
Lists sort by creation date descending, then ID descending.

Omitting `type`, or passing an empty/whitespace-only value, returns all
products. Filter values are trimmed and matched as whole type values, not
substrings. Matching follows MySQL's `utf8mb4_unicode_ci` collation, which is
case/accent insensitive. An unknown type or empty database returns `data: []`.
The type must be one string of at most 100 characters; repeated type values
and unsupported query parameters return 400. Invalid IDs return 400 and
missing products return 404. Deleted orders' products disappear from these
endpoints through the existing cascade policy.

`POST /api/products` creates a product for an existing order. Replace `orderId`
below with an existing order ID:

```bash
curl -X POST http://localhost:3001/api/products \
  -H 'Content-Type: application/json' \
  -d '{"orderId":1,"title":"Office monitor","type":"Monitors","serialNumber":"MON-NEW","isNew":true,"warrantyStart":"2026-10-01","warrantyEnd":"2028-10-01","priceUSD":"149.95","priceUAH":"6150.25","specification":"Full HD"}'
```

Success returns 201 with `{ "data": ...product }`. Invalid fields, extra
properties, reversed/invalid dates, negative prices, and prices outside
`DECIMAL(12,2)` return 400. Money inputs must be decimal strings. Warranty
inputs use `YYYY-MM-DD` and are stored at UTC midnight. A missing order returns
404; unexpected database failures return a safe 500 response. Serial numbers
are not unique. Full field constraints are documented in
[data contracts](docs/data-contracts.md#product-creation-and-validation-form).

In the browser, select an order and click "Добавить продукт". The form validates
fields, preserves values after failure, blocks duplicate submissions while
saving, and refreshes product lists, the order's products, count, and totals
after success. Images remain placeholders; image upload is not implemented.

## Clock and active sessions

The header uses Russian date/time formatting in the browser's local time zone.
It updates once per second, including the date at midnight. A placeholder is
rendered on the server and until the first timer tick to keep hydration consistent.
Inventory creation/warranty dates still use UTC as described above.

Socket.io connects to `NEXT_PUBLIC_SOCKET_URL` (default `http://localhost:3001`),
using the default `/socket.io` transport path and root namespace. Do not append
`/api` to this URL. The API broadcasts `sessions:count` with `{ "count": 2 }`
whenever a connection is added or removed; a newly connected tab receives the
current total as well. Each connected tab counts once, independent of its route.

The gateway keeps socket IDs in memory for one backend instance. This counts
connections, not unique users. Closing/unmounting a tab disconnects its socket;
silent network failures are eventually removed by Socket.io's default heartbeat
(25-second ping interval and 20-second timeout). Refreshes can briefly overlap
connections but do not leave permanent duplicates. The client reconnects after
temporary transport failures and receives a fresh count. Until a count arrives,
or while disconnected, the UI shows a dash with a connection status instead of
a stale number. The counter is shared across route navigation; listeners and
connections are cleaned up on unmount.

To check manually, open two tabs and verify the total increases; close one and
verify it decreases. Refresh a tab and switch between Orders/Products, then
restart the API and confirm the counter recovers without accumulating sessions.

## Interface language

Use the RU/UK select in the header to switch between Russian and Ukrainian.
Russian is the default. Navigation, inventory labels, forms and validation,
loading/error/empty states, accessible labels, page titles/descriptions, dates,
and price formatting follow the selected language. Inventory titles, types, and
other stored user data retain their original text.

The preference is stored as `inventory.locale` in browser `localStorage`, using
`ru` or `uk`. It survives reloads and synchronizes across tabs of the same origin.
Missing, invalid, or inaccessible storage falls back to Russian; switching still
works for the current session if saving is blocked. Only this non-sensitive UI
preference is stored there.

The server always renders Russian inventory HTML. Hydration starts in Russian
and then restores the saved language, avoiding server/client markup mismatches.
Consequently a saved Ukrainian preference can briefly show Russian on a fresh
load. Switching languages preserves the selected order, product filter, current
form values and validation feedback, inventory cache, and socket connection.
It does not reload the page or translate stored inventory data.

## Environment variables

Root `.env.example` configures the MySQL container. `apps/api/.env.example`
configures Prisma CLI, seed, and API runtime. Keep credentials, database names,
and ports consistent between the two files. Examples are for local development;
local `.env` files are ignored by Git.

| File | Variable | Role |
| --- | --- | --- |
| Root `.env` | `MYSQL_DATABASE`, `MYSQL_USER` | Application database and user |
| Root `.env` | `MYSQL_PASSWORD`, `MYSQL_ROOT_PASSWORD` | Local container credentials |
| Root `.env` | `MYSQL_PORT` | Host port; defaults to 3306, bound to 127.0.0.1 |
| API `.env` | `DATABASE_URL` | Application database connection |
| API `.env` | `SHADOW_DATABASE_URL` | Separate database used by development migrations |
| API `.env` | `PORT` | API port; defaults to 3001 |
| API `.env` | `FRONTEND_URL` | Allowed CORS origin |
| Web `.env.local` | `NEXT_PUBLIC_API_URL` | REST API URL including `/api`; defaults to `http://localhost:3001/api` |
| Web `.env.local` | `API_URL` | Optional server-only REST base URL including `/api`; falls back to `NEXT_PUBLIC_API_URL`, then localhost |
| Web `.env.local` | `NEXT_PUBLIC_SOCKET_URL` | Socket.io server origin without `/api`; defaults to `http://localhost:3001` |

Prisma CLI and the API load `apps/api/.env` without overriding process variables.
The frontend loads `.env.local`; restart it after changing URLs and
set production values before building. Percent-encode special characters in
connection-URL credentials. Runtime URL query options are not supported yet.

Changing `MYSQL_PORT` also requires updating both API connection URLs.
The development image initializes `${MYSQL_DATABASE}_shadow` with scoped user
privileges on first startup. Never use the application database as the shadow
because Prisma Migrate recreates its schema. Initialization only runs on an
empty volume; details for an existing development volume are in
[connection configuration](docs/data-contracts.md#connection-configuration).

## Database workflow

```bash
# Validate the schema or regenerate the client
npm --prefix apps/api run db:validate
npm --prefix apps/api run db:generate

# Create and apply a new development migration
npm --prefix apps/api run db:migrate -- --name describe_the_change

# Apply committed migrations without generating new ones
npm --prefix apps/api run db:deploy
npm --prefix apps/api run db:status

# Insert missing demo records or inspect the database
npm --prefix apps/api run db:seed
npm --prefix apps/api run db:studio

# Regenerate the reference SQL after migration changes
npm --prefix apps/api run db:schema:export
```

Commit migration files together with their schema changes. Generated client
files under `apps/api/src/generated/` are ignored and recreated before builds,
startup in development, and tests. Builds do not require a live database.

`database/schema.sql` is the reference schema for MySQL Workbench. Use
**File > Import > Reverse Engineer MySQL Create Script** to inspect its model
([Workbench guide](https://dev.mysql.com/doc/workbench/en/wb-reverse-engineer-create-script.html)),
or execute it against an empty reference database. It includes foreign keys,
indexes, decimal fields, and custom CHECK constraints. Use Prisma migrations
for the application's actual database setup, rather than importing this file.

Deleting an order deletes its associated products through `ON DELETE CASCADE`.
Deleting other orders does not affect those products. Prices are stored
independently in USD/UAH; UAH is the primary display currency. Dates use UTC.

## Checks and production builds

```bash
npm --prefix apps/web run lint
npm --prefix apps/web test
npm --prefix apps/web run build
npm --prefix apps/api run db:validate
npm --prefix apps/api run lint
npm --prefix apps/api test
npm --prefix apps/api run build
```

Database integration tests require a running, migrated MySQL database:

```bash
npm --prefix apps/api run test:e2e
```

HTTP and Socket.io integration tests build and exercise the compiled NestJS modules.
Socket tests use an isolated server with two clients over polling and WebSocket,
covering count broadcasts, closing, refreshing, and automatic reconnection.
Integration-test writes are rolled back; fixture records are not deleted.
MySQL auto-increment counters can advance during rolled-back tests.

After building, start the applications in separate terminals:

```bash
npm --prefix apps/api run start:prod
```

```bash
npm --prefix apps/web run start
```

## Docker and remaining delivery

Compose currently provides the database only. Web and API run through npm;
full application containers, deployment instructions, live demo/video links,
and final delivery checks will be added in subsequent stages.

The full Junior+ matrix is included in the delivery scope, as selected on
October 16, 2026. TypeScript, unit tests, and inventory SSR for Orders and Products
are implemented, together with Russian/Ukrainian i18n and a persisted language
preference. JWT authentication for inventory mutations, inventory charts, an office
location map, and meaningful lazy loading remain planned. These features are
tracked with completion criteria in [TODO.md](TODO.md)
and must be verified before final submission.

MySQL data persists in a named volume. To stop the local database while
preserving it:

```bash
docker compose stop mysql
```
