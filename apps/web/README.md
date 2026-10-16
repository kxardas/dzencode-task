# Orders & Products — Web

Next.js App Router frontend with a shared header and navigation for Orders
and Products. `/` redirects to `/orders`. The Orders page server-renders real
order summaries and initializes RTK Query with them: names, product counts, two date formats, and USD/UAH
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

The application defaults to Russian, using the reference labels "Приходы" and
"Продукты". The header's RU/UK select switches the interface to Ukrainian and
updates HTML `lang`, accessible labels, page metadata, dates, and price formatting.
Stored inventory data is displayed in its original language.

Bootstrap 5 CSS provides shared utilities, with custom SCSS and BEM classes.
The sidebar becomes horizontal navigation below 768px. Active routes are
highlighted and page-entry animations respect reduced-motion preferences.
The root layout and route pages remain Server Components. The sidebar, Redux
provider, and inventory lists use Client Components. The provider creates its own
store instance, persists across navigation, and sits behind Suspense for
Next.js Cache Components compatibility. Orders and Products read inventory on the
Next.js server at request time; type filtering and order details fetch in the browser.

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
The request timeout is ten seconds. `NEXT_PUBLIC_SOCKET_URL` points to the API
origin without `/api` (default `http://localhost:3001`).
For server-side requests, optional `API_URL` overrides `NEXT_PUBLIC_API_URL`.
Use a base URL including `/api`; this allows an internal API address in Docker
without exposing it to the browser. Restart Next.js after changing this value.

## Header clock and sessions

`HeaderClock` displays Russian date/time in the browser's local time zone and
updates every second. Its initial placeholder keeps server/client HTML identical;
the actual time appears on the first tick. The timer is removed on unmount.

`SessionCounter` opens a Socket.io connection after mounting and subscribes to
`sessions:count` (`{ count: number }`). Each connected tab counts once. The
component stays mounted during route navigation, reconnects after temporary
network failures, and removes listeners/disconnects on unmount. The UI displays
a dash and connection status before receiving data or while disconnected.
See the [session contract and manual check](../../README.md#clock-and-active-sessions).

## Data fetching

The Orders and Products pages wait for a real request with `connection()` before
fetching their API lists with `cache: "no-store"` and a ten-second timeout. This keeps
inventory fresh per request and allows production builds without a running API.
The surrounding layout Suspense boundary streams the dynamic inventory HTML.

Each page passes serializable inventory to its client boundary (`OrdersClient`
or `ProductsClient`). Before rendering the list, it calls the store's respective
initializer, which synchronously seeds the matching RTK Query cache. This happens once per
store and only when that query is uninitialized. Stores are created per server
request and per browser app instance. Existing client caches are preserved;
reused route payloads cannot restore deleted orders, even after cache eviction.
Hydration uses the same data and does not issue a second initial list request.
Successful product creation or order deletion disables Products bootstrapping
for that store, even before the first Products visit. This prevents an earlier
prefetched route payload from restoring stale inventory; RTK Query fetches current
data when there is no cached list. Filtered queries remain independent.

If SSR fetching fails, the server logs a generic diagnostic and the page falls
back to the existing client query, including safe errors and the retry button.
Initial data is not retained as a separate list or ordinary Redux slice.

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

## Localization and storage

`src/i18n/messages.ts` defines typed RU/UK dictionaries and interpolation.
`LocaleProvider` owns a per-provider preference store subscribed with
`useSyncExternalStore`. Server rendering and initial hydration always use `ru`;
the saved `inventory.locale` (`ru` or `uk`) is restored from `localStorage` after
hydration. This can briefly display Russian before a saved Ukrainian preference
appears. No language cookie or locale-specific route is required.

Invalid/missing/inaccessible storage uses Russian. A blocked write still allows
language switching in memory. Storage events synchronize other tabs; listeners
are cleaned up. The preference does not contain credentials or inventory data.

Switching the context preserves component and RTK Query state: selections,
filters, form drafts, validation errors, and the existing socket. Validation
returns locale-independent message keys and parameters. UI components translate
those errors at render time. Inventory dates retain UTC; the header clock retains
the browser's local time zone.

Page client boundaries synchronize the document title and observe late Next.js
streamed title updates so default-language server metadata cannot overwrite the
selected translation. Observers are removed on unmount. The layout and route pages
remain Server Components; passing them through the language provider does not
change that boundary.

## Checks

```bash
npm run lint
npm test
npm run build
```

Vitest, React Testing Library, and jsdom exercise real RTK Query requests with
mocked fetch responses. Ninety-two tests cover loading/data formatting, empty
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
after creation. Header tests cover midnight/time updates, consistent initial
HTML, timer cleanup, session broadcasts, connection errors/recovery, and
listener/connection cleanup under React Strict Mode.
SSR tests cover request-time fetching, API address selection, server errors,
actual server markup and hydration, isolated stores, empty collections,
client-side recovery, successful deletion/navigation/cache eviction, and
successful creation with a server-initialized list. A production HTTP response
was compared with the running API: four order rows and six product rows, their
titles, and product order associations were present in actual HTML article
elements, outside serialized script data. Safari review verified desktop and
320px layouts, route navigation, product filtering/reset/empty results, dialog
cancellation and confirmed deletion, empty form validation and successful creation,
and the active-tab sequence 1 → 2 → 2 after refresh → 1 on close.
The [browser workflow report](../../docs/browser-verification.md) records the
temporary fixture, resulting totals, navigation checks, and database comparison.
The Vitest tests do not require the API or MySQL; the browser workflow uses both.
Localization tests additionally cover defaults, invalid/blocked storage,
persistence, cross-tab changes and cleanup, hydration with a saved Ukrainian
preference, late metadata, draft/error/filter preservation, localized dates, and
switching without another inventory request or socket connection. Test setup
uses jsdom's origin-scoped storage instead of Node 26's optional native storage.
