# Orders & Products: Web

Next.js (App Router) frontend: the Orders and Products pages, the header with clock, tab counter, language and login, the inventory chart and the demo office map.

For setting up the whole project and the manual test checklist, see the [root README](../../README.md). Commands below run inside `apps/web`.

## Running

The API must be running (see [Running without Docker](../../README.md#running-without-docker)).

```bash
npm ci
cp .env.example .env.local   # first time only
npm run dev
```

Open http://localhost:3000. If the API isn't reachable, the pages show an error with a retry button rather than a blank screen.

| Variable | Default | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001/api` | Used by the browser. Baked in at build time. |
| `NEXT_PUBLIC_SOCKET_URL` | `http://localhost:3001` | Socket.io origin, without `/api` |
| `API_URL` | same as above | Optional. Used only for server-side rendering, so Docker can use the internal `http://api:3001/api` address. |

Restart `npm run dev` after changing `.env.local`. For a production build, set these before `npm run build`.

## Scripts

```bash
npm run dev     # dev server
npm test        # Vitest + React Testing Library, no API needed
npm run lint    # ESLint
npm run build   # production build
npm start       # serve the production build
```

## Code layout

```text
src/
  app/                 routes: /orders, /products, /login; / redirects to /orders
  components/layout/   header, sidebar, clock, session counter
  features/orders/     order list, details panel, delete dialog
  features/products/   product list, type filter, create form, statistics chart
  features/auth/       login form, header login/logout controls
  features/office/     demo office map (config in office.config.ts)
  store/               Redux store and RTK Query API (api.ts)
  i18n/                RU/UK messages and the language provider
  lib/format.ts        date and price formatting
  styles/              SCSS partials, BEM class names
```

Layouts and route pages are Server Components. Anything interactive (lists, forms, the counter, the language switch) is a Client Component.

## How data flows

- **SSR first, then RTK Query.** `/orders` and `/products` fetch the lists on the server for every request, so the HTML already contains the data. The client component then puts that data into the RTK Query cache, so the browser doesn't fetch the same list again on load. Everything after that (filtering, order details, refreshes, mutations) goes through RTK Query in the browser.
- **No duplicated server data.** Orders and products live only in the RTK Query cache. There are no Redux slices copying them. Local UI state, like the selected order or form values, is plain React state.
- **After a mutation.** Deleting an order removes it and its products from every cached list right away, then invalidates the related queries. Adding a product invalidates the order and product lists, so counts and totals come from the server instead of being recalculated on the client.
- If the server-side fetch fails, the page falls back to a normal client request with loading and error states.

## Header

- **Clock:** browser local time, updated every second. The server renders a placeholder, and the time appears after hydration. This avoids a mismatch between server and browser time.
- **Tab counter:** opens one Socket.io connection and listens for `sessions:count`. It shows a dash while connecting or disconnected, and Socket.io reconnects on its own. The connection lives in the layout, so switching pages doesn't create new sessions.

## Language and Web Storage

`src/i18n/messages.ts` holds typed RU and UK dictionaries. Russian is the default. The choice is saved in `localStorage` as `inventory.locale` and synced across tabs. The server always renders Russian, and the saved language is applied after hydration, so a short Russian flash on reload is expected. If storage is blocked or holds garbage, the app falls back to Russian without errors.

Only interface text is translated. Titles and types from the database are shown as stored.

## Login

The login form posts to `/api/auth/login`, and the API sets an HttpOnly cookie. The frontend never sees the token and never stores it. It only asks `/api/auth/session` who is logged in. Add and delete buttons are disabled until that returns a user. Write requests send `credentials: "include"` and the `X-Inventory-Request: 1` header the API expects. Redux DevTools are turned off so the password doesn't end up in the action history.

## Lazy loading: chart and map

- **Chart** (Products → Статистика инвентаря): loaded with `React.lazy` when the panel is opened for the first time. It's built from plain HTML and SCSS bars and counts all products from the cached unfiltered list, so it doesn't depend on the current filter.
- **Map** (bottom of every page): loaded with `next/dynamic` and `ssr: false`, because Leaflet needs `window`. The tiles come from OpenStreetMap. The address and an external link are rendered without the map, so they work even if it fails to load. To change the location, edit `src/features/office/office.config.ts`.

To see it working: open DevTools → Network, reload, then open the chart or map. The extra JS chunk (and map tiles) appear only after you click.

## Tests

`npm test` runs Vitest with jsdom. Requests go through the real RTK Query code with mocked `fetch`, and the socket is mocked. The tests cover order selection and the details panel, delete confirmation and cancel, filtering and empty results, form validation and failed saves, error and retry states, the clock and the counter, language switching and storage, login and logout, SSR hydration, the chart and the map.

## Docker

The Docker build sets `DOCKER_BUILD=1`, which switches Next.js to `standalone` output for a small runtime image. `NEXT_PUBLIC_*` values are build arguments, because Next.js inlines them into the bundle, while `API_URL` is read at runtime. A normal `npm run build` is unaffected.
