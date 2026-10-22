# Orders & Products

A small inventory app built for the dZENcode Junior+ React.js assessment. You can browse incoming orders and their products, filter products by type, add a product to an order, and delete an order.

- **Live demo:** https://dzencode-halimurka.online
- **Demo video:** not published yet
- **Original assignment:** [`task/`](task/) (PDF, example data, reference screenshots)

Browsing is public. Adding products and deleting orders require a login (see [Login](#login)).

## Contents

1. [Quick start with Docker](#quick-start-with-docker) (recommended for QA)
2. [Demo data](#demo-data)
3. [Login](#login)
4. [Manual test checklist](#manual-test-checklist)
5. [Running without Docker](#running-without-docker)
6. [Automated tests](#automated-tests)
7. [API](#api)
8. [Active sessions (WebSocket)](#active-sessions-websocket)
9. [Environment variables](#environment-variables)
10. [Database and migrations](#database-and-migrations)
11. [How the project is organized](#how-the-project-is-organized)
12. [Deployment](#deployment)
13. [Troubleshooting](#troubleshooting)
14. [Known limitations](#known-limitations)

## Quick start with Docker

This is the shortest way to get the whole thing running: MySQL, the API and the web app, each in its own container. You don't need Node.js on your machine for this.

You need Git, Docker with Compose v2 (Docker Desktop is fine), and free ports **3000**, **3001** and **3306** on localhost.

**1. Clone the repository and create the root `.env`:**

```bash
git clone https://github.com/kxardas/dzencode-task.git
cd dzencode-task
cp .env.example .env
```

The defaults in `.env` are fine for a local run. If one of the ports is taken, change `WEB_PORT`, `API_PORT` or `MYSQL_PORT` there.

**2. Generate login credentials for the Docker setup.** This is needed only once. The API refuses to start without them.

```bash
mkdir -p .docker
docker compose build api
docker compose run --rm --no-deps \
  --user "$(id -u):$(id -g)" \
  --entrypoint node \
  --volume "$PWD/.docker:/setup" \
  api scripts/setup-auth.mjs /setup
```

You should see `Authentication configured.` Two private files appear in `.docker/`: `.env` (secrets for the API) and `.auth-local.json` (username and password for you). Both are ignored by Git.

**3. Start everything:**

```bash
docker compose up -d --build --wait --wait-timeout 180
```

The first build takes a few minutes. The command returns once all three containers report `Healthy`. Database migrations are applied automatically when the API starts.

**4. Load demo data.** The database starts empty. To fill it with test orders and products:

```bash
docker compose exec api npx prisma db seed
```

Running it again is safe: it only adds missing rows and never overwrites or deletes anything.

**5. Open the app:** http://localhost:3000. It redirects to the Orders page. The API is at http://localhost:3001/api (try http://localhost:3001/api/orders).

### Everyday Docker commands

| What you want | Command |
| --- | --- |
| See container status | `docker compose ps` |
| Follow logs | `docker compose logs -f web api` |
| Stop, keep data | `docker compose down` |
| Start again | `docker compose up -d --wait` |
| Rebuild after pulling new code | `docker compose up -d --build --wait` |
| Wipe the database and start clean | `docker compose down -v`, then steps 3–4 |

`docker compose down -v` deletes the MySQL volume, so all orders and products are gone. Your credentials in `.docker/` stay, so step 2 is not needed again.

## Demo data

After seeding, the database contains 4 orders and 6 products. This is what you should see in the UI and API:

| ID | Order | Products | Total USD | Total UAH |
| --- | --- | --- | --- | --- |
| 1 | Office monitors delivery | 2 | 649.94 | 26 650.75 |
| 2 | Peripherals and accessories | 2 | 40.00 | 1 640.00 |
| 3 | Pending delivery | 0 | 0.00 | 0.00 |
| 4 | Additional equipment for the second office and remote workstations | 2 | 108.99 | 4 468.59 |

- Order 3 is intentionally empty, for checking empty states.
- Order 4 has a long title, for checking layout and wrapping.
- Product types: `Monitors` (2), `Keyboards` (2), `Accessories` (2).
- Product IDs are 1001–1006.
- The lists are sorted newest first, so order 4 is at the top.

## Login

Credentials are generated per environment and are never committed.

- **Docker:** `.docker/.auth-local.json`
- **Without Docker:** `apps/api/.auth-local.json`
- **Live demo:** credentials are sent to the evaluator privately.

The username is `evaluator` unless you changed `DEMO_USERNAME`. Sign in at http://localhost:3000/login or with the **Вход** button in the header.

There is a single account and no registration. A login lasts 15 minutes. When it expires, the next change shows a message asking you to log in again, and whatever you typed into the form is kept.

## Manual test checklist

The UI is in Russian by default. Labels below are given in Russian, as they appear on screen. Use the demo data above as the expected values.

### Layout and navigation

- [ ] `/` redirects to `/orders`.
- [ ] The left menu has **Приходы** (Orders) and **Продукты** (Products). The current page is highlighted.
- [ ] Switching pages doesn't reload the browser. The header clock keeps ticking without resetting, and the page content fades in.
- [ ] Below 768px the menu becomes a horizontal bar at the top. Nothing overflows horizontally at 320px.

### Header

- [ ] The date and time update every second, in your computer's time zone.
- [ ] The tab counter shows `1` with one tab open.
- [ ] Open a second tab: both tabs show `2` within a second or two.
- [ ] Refresh one tab: the count goes back to `2`, not `3`.
- [ ] Close one tab: the other shows `1`.
- [ ] Stop the API (`docker compose stop api`): the counter shows a dash and a reconnecting status. Start it again (`docker compose start api`): the count comes back.

### Orders (`/orders`)

- [ ] Each row shows the title, the number of products, the date in two formats (`12.10` and `12 окт. 2026 г.`), and the total in USD and UAH.
- [ ] Totals match the [demo data](#demo-data) table.
- [ ] Clicking an order opens a details panel next to the list (below it on narrow screens) with that order's products only.
- [ ] Order 3 opens with the message that it has no products.
- [ ] The **×** button closes the panel. Clicking another order switches the panel to that order.

### Deleting an order (requires login)

- [ ] When logged out, the delete buttons are disabled and there is a link asking you to sign in.
- [ ] After logging in, the trash button opens a dialog with the order title and a warning that its products will be deleted too.
- [ ] **Отмена**, the **×** button and the Esc key close the dialog. Nothing is deleted.
- [ ] **Удалить** removes the order. If its panel was open, the panel closes.
- [ ] The order's products also disappear from the Products page. This is intentional: deletion cascades to products.

### Adding a product (requires login)

Open an order and click **Добавить продукт**.

- [ ] Submitting the empty form shows an error under each required field. Nothing is sent.
- [ ] A warranty end date earlier than the start date is rejected.
- [ ] Prices accept up to two decimal places. Both `10.5` and `10,5` work. `1.999`, `-1` and `abc` are rejected.
- [ ] Description is optional and is the only optional field.
- [ ] After a successful save, the product appears in the panel, the order's product count and totals update, and the product shows up on the Products page.

The API checks the same rules, so you can't get around them with a direct request (see [API](#api)).

### Products (`/products`)

- [ ] Each row shows the title, type, warranty dates in two formats, the price in USD and UAH, and the order it belongs to.
- [ ] The **Тип продукта** select filters the list. **Все типы** shows everything again.
- [ ] Empty result: the select only lists existing types, so this takes two tabs. In tab A, filter by `Monitors`. In tab B, log in and delete order 1. Switch back to tab A. The list refreshes and shows the empty-state message.
- [ ] **Статистика инвентаря** expands a bar chart of products by type. It always counts all products, so filtering the list doesn't change it.

### Language

- [ ] The select in the header switches between RU and UK. Labels, dates and number formats change. Data from the database (titles, types) stays as entered.
- [ ] Switching language keeps the open order, the active filter and anything typed into the form.
- [ ] After a page refresh, the chosen language is restored. Russian may flash for a moment first. This is expected, because the server always renders Russian.

### Office map

- [ ] At the bottom of each page, **Показать карту** opens an interactive map with a marker. The address and the OpenStreetMap link are visible even before opening it.
- [ ] The location is labelled as demo data. It is not the company's address.
- [ ] The map needs internet access for tiles. Offline, the map shows an error and a retry button, and the address remains visible.

### Login and logout

- [ ] A wrong password shows a generic error. It doesn't say which field was wrong.
- [ ] After logging in, the header shows the username and a **Выйти** button.
- [ ] After logout, the delete and add buttons are disabled again.

## Running without Docker

Use this if you want to run the apps directly, for example with hot reload. MySQL still runs in Docker.

You need Node.js **26.7.0** and npm **11.19.0** (pinned in `.nvmrc`; with nvm, run `nvm install && nvm use`), plus Docker for MySQL. If the Docker stack from the previous section is running, stop it first (`docker compose down`), because both use the same ports.

```bash
# 1. Install dependencies and create local config files
npm --prefix apps/web ci
npm --prefix apps/api ci
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# 2. Generate local login credentials (written to apps/api/.env and apps/api/.auth-local.json)
npm --prefix apps/api run auth:setup

# 3. Start MySQL, apply migrations, add demo data
docker compose up -d --build --wait --wait-timeout 180 mysql
npm --prefix apps/api run db:deploy
npm --prefix apps/api run db:seed
```

Then start the API and the web app in two separate terminals:

```bash
npm --prefix apps/api run start:dev
```

```bash
npm --prefix apps/web run dev
```

Open http://localhost:3000.

Only copy the `.env.example` files the first time. Copying them again overwrites your local values, including the generated login secret.

## Automated tests

Run these from the repository root after `npm ci` in both apps.

```bash
# Frontend: unit and component tests (no API or database needed)
npm --prefix apps/web test

# Backend: unit tests (no database needed)
npm --prefix apps/api test

# Backend: integration tests against real MySQL and Socket.io
npm --prefix apps/api run test:e2e

# Linters and production builds
npm --prefix apps/web run lint
npm --prefix apps/api run lint
npm --prefix apps/web run build
npm --prefix apps/api run build
```

`test:e2e` needs MySQL running with migrations applied (step 3 of [Running without Docker](#running-without-docker)). It uses the database from `apps/api/.env`, and every write is rolled back, so your data is not changed. The only side effect is that auto-increment IDs may skip a few numbers.

What the tests cover, roughly:

- **Web:** order totals and counts, selecting an order, the details panel, delete confirmation and cancellation, product filtering and empty results, form validation, error and retry states, the clock and session counter, language switching, login, SSR hydration, the chart and the map.
- **API:** order and product endpoints, filtering, validation, cascading deletion, 400/404 handling, safe 500 responses, authentication, and session counting with real Socket.io clients.

## API

Base URL: `http://localhost:3001/api`. Every successful response wraps its payload in `data`. The two exceptions are delete and logout, which return `204` with an empty body.

| Method | Path | What it does | Login |
| --- | --- | --- | --- |
| `GET` | `/orders` | All orders with product count and totals | no |
| `GET` | `/orders/:id` | One order with its products | no |
| `DELETE` | `/orders/:id` | Delete an order and its products | yes |
| `GET` | `/products` | All products, each with `order: { id, title }` | no |
| `GET` | `/products?type=Monitors` | Products of one type | no |
| `GET` | `/products/:id` | One product | no |
| `POST` | `/products` | Add a product to an order | yes |
| `POST` | `/auth/login` | Log in, sets a cookie | no |
| `GET` | `/auth/session` | Current user, or `user: null` | no |
| `POST` | `/auth/logout` | Clear the cookie | no |

Things worth knowing when testing the API by hand:

- Prices are strings with two decimals (`"649.94"`). Dates are UTC ISO strings.
- An invalid ID (`/orders/abc`, `/orders/0`) returns `400`. A missing record returns `404`. Deleting the same order twice gives `204`, then `404`.
- `?type=` matches the whole type name and ignores case (`monitors` works, `Monit` doesn't). An empty `type` returns all products.
- Unknown fields in a `POST` body are rejected with `400`.

### Calling protected endpoints with curl

Login, logout, product creation and order deletion only accept requests that look like they come from the web app. Without these two headers, you get `403 Untrusted write request`:

- `Origin: http://localhost:3000` (must match `FRONTEND_URL` exactly)
- `X-Inventory-Request: 1`

Example session (with the Docker setup, credentials are in `.docker/.auth-local.json`):

```bash
H=(-H 'Origin: http://localhost:3000' -H 'X-Inventory-Request: 1')

# Log in and store the cookie in cookies.txt
curl -c cookies.txt "${H[@]}" -H 'Content-Type: application/json' \
  -X POST http://localhost:3001/api/auth/login \
  -d '{"username":"evaluator","password":"<password from .auth-local.json>"}'

# Add a product to order 3
curl -b cookies.txt "${H[@]}" -H 'Content-Type: application/json' \
  -X POST http://localhost:3001/api/products \
  -d '{"orderId":3,"title":"Test monitor","type":"Monitors","serialNumber":"QA-001","isNew":true,"warrantyStart":"2026-10-01","warrantyEnd":"2028-10-01","priceUSD":"149.95","priceUAH":"6150.25","specification":"Full HD"}'

# Delete order 3 together with its products
curl -b cookies.txt "${H[@]}" -X DELETE http://localhost:3001/api/orders/3
```

`POST /products` fields:

| Field | Rules |
| --- | --- |
| `orderId` | ID of an existing order (`404` otherwise) |
| `title` | required, up to 255 characters |
| `type`, `serialNumber` | required, up to 100 characters. Serial numbers don't have to be unique. |
| `warrantyStart`, `warrantyEnd` | `YYYY-MM-DD`; the end can't be before the start |
| `priceUSD`, `priceUAH` | decimal strings, `0` to `9999999999.99`, at most two decimals |
| `isNew` | optional boolean, defaults to `true` |
| `specification` | optional, up to 10 000 characters |
| `photo` | optional `http(s)` URL or `null`. There is no upload in the UI. |

## Active sessions (WebSocket)

The number in the header is the count of browser tabs currently connected to the API over Socket.io. It's not a count of users: two tabs from the same person count as two.

- The server keeps the list of connected sockets in memory and sends `sessions:count` with `{ "count": n }` to every client whenever someone connects or disconnects.
- Closing a tab disconnects immediately. If a client disappears without closing the connection (network drop, sleeping laptop), Socket.io notices it within about 45 seconds and removes it.
- A refresh can briefly show one extra session, but it doesn't add up over time.
- The browser reconnects automatically after the API restarts.

Because the count lives in the API process memory, it resets when the API restarts and only works with a single API instance.

## Environment variables

There are three config files. Each has a committed `.example` next to it.

**Root `.env`** (used by Docker Compose)

| Variable | Default | Purpose |
| --- | --- | --- |
| `MYSQL_DATABASE` | `orders_products` | Database name |
| `MYSQL_USER`, `MYSQL_PASSWORD` | `app` / `app_password` | Application DB user |
| `MYSQL_ROOT_PASSWORD` | `root_password` | MySQL root password |
| `MYSQL_PORT` | `3306` | MySQL port on localhost |
| `WEB_PORT`, `API_PORT` | `3000`, `3001` | Ports for the Docker web and API containers |
| `FRONTEND_URL` | commented out | Production only: public HTTPS address of the site |

**`apps/api/.env`** (API without Docker)

| Variable | Purpose |
| --- | --- |
| `PORT` | API port, `3001` by default |
| `DATABASE_URL` | MySQL connection string |
| `SHADOW_DATABASE_URL` | Scratch database for creating new migrations. Only needed by `db:migrate`. |
| `FRONTEND_URL` | Web app address. Used for CORS and the write-request check. |
| `JWT_SECRET`, `DEMO_USERNAME`, `DEMO_PASSWORD_HASH` | Login settings, generated by `npm run auth:setup` |

**`apps/web/.env.local`** (web app without Docker)

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | API address used by the browser, including `/api` |
| `NEXT_PUBLIC_SOCKET_URL` | API address for Socket.io, without `/api` |
| `API_URL` | Optional API address for server-side rendering. Falls back to `NEXT_PUBLIC_API_URL`. |

If you change a port in the root `.env` and run without Docker, update the matching URLs in the other two files. Restart the web app after editing `.env.local`.

## Database and migrations

MySQL 8.4 with Prisma. The schema is in `apps/api/prisma/schema.prisma`, and migrations are in `apps/api/prisma/migrations/`.

- One order has many products, and each product belongs to exactly one order.
- Deleting an order deletes its products (`ON DELETE CASCADE`). The assignment doesn't say what should happen to them. Keeping products without an order would leave them with nothing to show in the "order" column, so cascading seemed the most sensible choice.
- Prices are stored as `DECIMAL(12,2)` in both USD and UAH. Nothing is converted at runtime: both values are entered with the product, as in the example data. UAH is the main currency.
- All dates are stored and returned in UTC.

**MySQL Workbench:** the schema is in [`database/schema.sql`](database/schema.sql). Open it with *File → Import → Reverse Engineer MySQL Create Script*. It's generated from the migrations, so it matches the real database. To set up an actual database, use the migrations, not this file.

Database commands (without Docker, from the repository root):

```bash
npm --prefix apps/api run db:deploy        # apply committed migrations
npm --prefix apps/api run db:seed          # add demo data (safe to repeat)
npm --prefix apps/api run db:status        # check which migrations are applied
npm --prefix apps/api run db:studio        # browse the data in Prisma Studio
npm --prefix apps/api run db:migrate -- --name add_something   # create a new migration (developers only)
npm --prefix apps/api run db:schema:export # regenerate database/schema.sql
```

Field names differ slightly from `task/app.js`: `date` → `createdAt`, `order` → `orderId`, `guarantee.start/end` → `warrantyStart/End`, and the `price` array → `priceUSD` and `priceUAH`. The example's `isNew: 0/1` became a boolean.

## How the project is organized

```text
apps/web/       Next.js frontend (see apps/web/README.md)
apps/api/       NestJS API, Prisma schema and migrations (see apps/api/README.md)
database/       MySQL image setup and the Workbench schema
deploy/         Example reverse-proxy config for a server
task/           The original assignment
```

**Stack:** Next.js (App Router), React, TypeScript, Redux Toolkit with RTK Query, Bootstrap 5 with SCSS and BEM, Socket.io, NestJS, Prisma, MySQL, Vitest and React Testing Library, Docker Compose.

A few decisions that are useful to know when testing:

- **SSR.** Orders and Products are rendered on the server with real data, so the data is already in the HTML ("View page source" shows it). After that, the page works as a normal SPA: navigation, filtering and updates happen in the browser through RTK Query.
- **Auth.** The login is stored in an HttpOnly cookie, so JavaScript can't read it and it's never in `localStorage`. Only the language choice is stored there (`inventory.locale`).
- **Lazy loading.** The chart and the map are loaded only when you open them. In DevTools → Network, their JS files appear only after you click.
- **Form validation** runs in both places. The browser checks the form before sending, and the API checks again with DTOs.

## Deployment

The live demo runs on a single server with Docker Compose behind Caddy, which handles HTTPS.

To deploy on another server:

1. Copy the project, create `.env` from `.env.example`, set **new** database passwords, and set `FRONTEND_URL` to the public HTTPS address (for example `FRONTEND_URL=https://inventory.example.com`, without a trailing slash).
2. Generate fresh credentials with the same command as in [step 2](#quick-start-with-docker). Don't reuse local ones.
3. Start with the production override, which turns on secure cookies and hides the MySQL port:

   ```bash
   docker compose -f docker-compose.yml -f docker-compose.production.yml up -d --build --wait
   ```

4. Point the reverse proxy at the containers: `/api/*` and `/socket.io/*` go to port 3001, everything else to port 3000. A ready-made Caddy example is in [`deploy/Caddyfile.example`](deploy/Caddyfile.example).

To update, pull the new code and run the command from step 3 again. Keep `.env`, `.docker/` and the MySQL volume.

## Troubleshooting

**`docker compose up` fails with "Set MYSQL_USER in .env" or "Copy .env.example to .env".**
You skipped `cp .env.example .env` in the repository root.

**The `api` container keeps restarting or `--wait` times out.**
Check `docker compose logs api`. Usually the credentials from [step 2](#quick-start-with-docker) are missing. Make sure `.docker/.env` exists.

**`port is already allocated` or `EADDRINUSE`.**
Something else is using 3000, 3001 or 3306, often a local MySQL or the other way of running the project. Stop it, or change the ports in `.env`.

**The page loads but shows "Не удалось загрузить приходы".**
The API isn't reachable. Check http://localhost:3001/api/orders directly. Without Docker, make sure `npm --prefix apps/api run start:dev` is running.

**curl gets `403 Untrusted write request`.**
Add the `Origin` and `X-Inventory-Request: 1` headers (see [curl examples](#calling-protected-endpoints-with-curl)).

**curl gets `401` on a write after logging in.**
The cookie expired (15 minutes) or wasn't sent. Log in again and pass `-b cookies.txt`.

**`auth:setup` says "Local access file already exists".**
It won't overwrite existing credentials on purpose. Use the password from the existing `.auth-local.json`. To start over, delete both `.auth-local.json` and the generated lines (`JWT_SECRET`, `DEMO_PASSWORD_HASH`) in the matching `.env`.

**`db:migrate` complains about the shadow database on an older MySQL volume.**
Create it once with `docker compose exec -T mysql sh /docker-entrypoint-initdb.d/init-shadow.sh`. This only matters when you create new migrations.

**The map shows an error.**
Map tiles come from `tile.openstreetmap.org`, which needs internet access. The rest of the app works offline.

## Known limitations

- Only one login account, with no registration or roles. Logging out clears the cookie, but a copied token stays valid until it expires (15 minutes). There is no limit on login attempts.
- The session counter lives in the memory of one API process. It resets on restart and isn't shared between several API instances.
- Product photos are placeholders. There is no image upload.
- Data from the database (titles, types) isn't translated. Only the interface is.
- On a fresh load with Ukrainian selected, Russian can flash for a moment before the saved language is applied.
- Only orders can be deleted. Products can't be deleted or edited on their own. The reference screenshots show more controls (search, extra menu items, product deletion), but these aren't part of the written assignment.
- The office map location is demo data in Kyiv, and the map depends on the public OpenStreetMap tile server.
