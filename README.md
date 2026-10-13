# Orders & Products

A full-stack inventory management application developed for the dZENcode
Junior+ React.js technical assessment.

## Current status

The database foundation is implemented: MySQL, Prisma models and migrations,
development seed data, and a NestJS Prisma module with connection lifecycle
management. REST endpoints and application pages are the next stages.

The frontend root page is intentionally blank. The API connects to MySQL on
startup but has no HTTP endpoints yet, so `/api` returns 404.

See [TODO.md](TODO.md) for progress and
[data decisions and planned contracts](docs/data-contracts.md) for the model,
currencies, UTC dates, deletion policy, and intended API responses.

## Technology stack

- **Frontend:** Next.js App Router, React, TypeScript. Redux Toolkit/RTK Query,
  Bootstrap 5, SCSS with BEM, Lucide React, and Socket.io Client are installed
  for upcoming features.
- **Backend:** NestJS with ESM and TypeScript, Prisma 7.10.0 and its MySQL driver
  adapter. Validation libraries and Socket.io are installed for upcoming features.
- **Database:** MySQL 8.4.11, Prisma migrations, and decimal monetary columns.
- **Testing:** Backend Vitest unit tests and integration tests against MySQL.
  Frontend Vitest and React Testing Library setup is planned.
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

```bash
npm --prefix apps/web run dev
```

Open http://localhost:3000. A blank page is expected at this stage.
The API listens on http://localhost:3001 with the `/api` prefix; 404 responses
are expected until endpoints are implemented. CORS uses `FRONTEND_URL`.

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
| Web `.env.local` | `NEXT_PUBLIC_API_URL` | Reserved for upcoming REST requests |
| Web `.env.local` | `NEXT_PUBLIC_SOCKET_URL` | Reserved for upcoming Socket.io integration |

Prisma CLI and the API load `apps/api/.env` without overriding process variables.
The frontend supports Next.js environment files; copy its example to `.env.local`
when those integrations are implemented. Percent-encode special characters in
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
REST endpoints, and WebSocket behavior will be added in subsequent stages.

MySQL data persists in a named volume. To stop the local database while
preserving it:

```bash
docker compose stop mysql
```
