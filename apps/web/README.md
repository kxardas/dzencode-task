# Orders & Products — Web

Next.js App Router frontend with a shared header and navigation for Orders
and Products. `/` redirects to `/orders`. The Orders page loads real order
summaries through RTK Query: names, product counts, two date formats, and USD/UAH
totals. Loading, empty, error, retry, and background-refresh states are handled.
Selecting an order highlights its row and opens a closable panel with its title.
The panel appears beside the list on desktop and below it on narrower screens.
Products still has a placeholder; fetching panel products and deletion UI are planned.

The application interface is in Russian, using the reference labels
"Приходы" and "Продукты". The HTML language is `ru`; accessible labels and
page metadata follow the same language.

Bootstrap 5 CSS provides shared utilities, with custom SCSS and BEM classes.
The sidebar becomes horizontal navigation below 768px. Active routes are
highlighted and page-entry animations respect reduced-motion preferences.
The root layout and route pages remain Server Components. The sidebar, Redux
provider, and Orders list use Client Components. The provider creates its own
store instance, persists across navigation, and sits behind Suspense for
Next.js Cache Components compatibility. Inventory data is fetched in the
browser; this stage does not yet demonstrate SSR of inventory data.

## Development

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Copy the environment example only during initial setup, preserving existing
local values. `NEXT_PUBLIC_API_URL` points to the REST API, including `/api`,
and defaults to `http://localhost:3001/api`. Restart Next.js after changing it;
production builds embed public environment variables.

Follow the [root setup guide](../../README.md) to run MySQL and the API, then
open http://localhost:3000. The API must allow the frontend origin through
`FRONTEND_URL`. If the API is unavailable, Orders shows a retryable error.
The request timeout is ten seconds. Date/time and session counting are planned.

## Data fetching

`src/store/api.ts` defines the typed Orders query and unwraps the `{ data }`
response. `src/store/store.ts` registers its reducer and middleware. Server
data is kept in the RTK Query cache, not duplicated in a Redux slice.

Returning to Orders uses cached data immediately. Remounting after thirty
seconds requests fresh data; focus and reconnection also trigger refreshes.
Unused results remain cached for RTK Query's default sixty seconds. A failed
background refresh keeps previously loaded orders visible with an error.
Dates are displayed in Russian using UTC. Prices are formatted for display;
the backend remains responsible for exact decimal calculations.

## Checks

```bash
npm run lint
npm test
npm run build
```

Vitest, React Testing Library, and jsdom exercise real RTK Query requests with
mocked fetch responses. Six tests cover loading/data formatting, empty
collections, safe errors and retry, cache reuse, failed background refresh,
and order selection, switching, and panel closing.
These tests do not require the API or MySQL.
