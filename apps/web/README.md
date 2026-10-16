# Orders & Products — Web

Next.js App Router frontend with a shared header and navigation for Orders
and Products. `/` redirects to `/orders`. The Orders page loads real order
summaries through RTK Query: names, product counts, two date formats, and USD/UAH
totals. Loading, empty, error, retry, and background-refresh states are handled.
Selecting an order highlights its row and opens a closable panel with its products:
placeholder icons, titles, serial numbers, and new/used condition.
The panel appears beside the list on desktop and below it on narrower screens.
Orders can be deleted through a confirmation dialog that explains cascading
product deletion. It handles pending/error states and updates the list after
success. Products displays all inventory with type filtering, UTC warranty dates
in short/full formats, USD/UAH prices, and associated order titles.

Selecting an order also offers "Добавить продукт". The inline form validates
required fields, warranty dates, and decimal prices before POST. It preserves
values after failure and disables controls while saving. Success refreshes
order summaries/details and product lists. Image inputs/uploads are not part
of this form; existing placeholders remain.

The application interface is in Russian, using the reference labels
"Приходы" and "Продукты". The HTML language is `ru`; accessible labels and
page metadata follow the same language.

Bootstrap 5 CSS provides shared utilities, with custom SCSS and BEM classes.
The sidebar becomes horizontal navigation below 768px. Active routes are
highlighted and page-entry animations respect reduced-motion preferences.
The root layout and route pages remain Server Components. The sidebar, Redux
provider, and inventory lists use Client Components. The provider creates its own
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

`src/store/api.ts` defines typed order list/detail and product list queries, unwraps their
`{ data }` responses, and provides a DELETE mutation. `src/store/store.ts`
registers its reducer and middleware. Server
data is kept in the RTK Query cache, not duplicated in a Redux slice.

Returning to Orders uses cached data immediately. Remounting after thirty
seconds requests fresh data; focus and reconnection also trigger refreshes.
Unused results remain cached for RTK Query's default sixty seconds. A failed
background refresh keeps previously loaded orders visible with an error.
After successful deletion, the mutation removes the order and its associated
products from cached lists and invalidates affected order/product queries.
A failed refresh does not restore deleted rows. Failed deletion preserves cached orders and leaves
the dialog open for retry. Deleting the selected order closes its panel;
deleting another order preserves the current selection. Cancel, close, and
Escape work before submission and are blocked while DELETE is pending.
Dates are displayed in Russian using UTC. Prices are formatted for display;
the backend remains responsible for exact decimal calculations.

The product type options come from the unfiltered inventory so other types
remain selectable after filtering. Selecting a type requests `/products?type=...`;
resetting uses the unfiltered query. `currentData` prevents a previous filter's
results from appearing during the next request. Loading, empty, error/retry,
and failed background-refresh states are handled.

## Checks

```bash
npm run lint
npm test
npm run build
```

Vitest, React Testing Library, and jsdom exercise real RTK Query requests with
mocked fetch responses. Forty-five tests cover loading/data formatting, empty
collections, safe errors and retry, cache reuse, failed background refresh,
order selection, switching, panel closing, and deletion confirmation/cancellation.
Deletion coverage includes pending-state controls, duplicate submissions,
selected/unselected and last-order deletion, HTTP/network failures, retry, and
list-refresh failure after successful deletion.
Products coverage includes association and price/date formatting, filtering,
reset, empty results, safe errors/retry, stale-data avoidance, background-refresh
failure, and cascading deletion across unfiltered/filtered caches.
Form tests cover input normalization, storage limits, actual dates, warranty
ordering, pending controls, duplicate prevention, cancellation, HTTP/network
errors, retry, and refreshing product lists and exact server-calculated totals
after creation.
These tests do not require the API or MySQL.
