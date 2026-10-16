# Orders & Products — Development Checklist

Target submission: October 25, 2026.

Work in the order below. Add meaningful tests alongside each feature.
Check an item only when its completion criteria have been verified.
The assignment sources are in `task/`; standing project rules are in `AGENTS.md`.
Continue ordinary development directly on `main`, as agreed with the developer.
Keep commits small and meaningful; commit/push only when explicitly requested.
The developer selected the entire Junior+ matrix on October 16, 2026.
All nine Junior+ competencies below are included in the delivery scope.

## Implementation and delivery

- [x] **Initialize and clean the application skeletons.** Next.js and NestJS
  exist under `apps/`, generated demos are removed, and both applications
  passed lint and production build after cleanup.
- [x] **Finish the development baseline.** The root README documents
  installation, startup, environment examples, and current limitations.
  Node.js/npm versions are pinned; lockfile installation, lint, build, and
  production startup have been verified for both application skeletons.
  API watch/debug output is isolated in `build/` from production/test `dist/`.
  Watch startup, a concurrent production build, subsequent automatic restart,
  and real GET /api/products responses were verified after fixing their output conflict.
- [x] **Define data and API contracts.** Map `task/app.js` fields to typed
  entities and responses. Document currency defaults, date/time handling,
  money serialization, deletion behavior, and the small form's scope.
- [x] **Implement persistence and seed data.** Prisma CLI and Client are
  aligned at 7.10.0. MySQL starts locally; Prisma schema and migrations
  implement Order 1:N Product with decimal prices.
  Seeds include multiple product types, an empty order, and varied prices.
  Include an equivalent schema file that opens in MySQL Workbench.
- [x] **Finish Orders API.** List, detail, and deletion routes are implemented
  and tested: correct counts, independent decimal totals, UTC dates, and empty
  states. Details include only associated products. Deletion returns 204 and
  cascades to its products while preserving other orders and products.
  Missing/invalid IDs return 404/400; repeated deletion returns 404.
- [x] **Implement Products API.** List, detail, and type-filter endpoints
  return correct order associations and consistent responses. Invalid inputs
  and missing products are handled without leaking database errors.
  Filtering/reset, empty results, price/date serialization, stable ordering,
  and visibility after cascading deletion are verified against MySQL.
- [x] **Build the shared frontend foundation.** Configure Redux Toolkit and
  RTK Query without duplicating server data. Add Bootstrap/SCSS/BEM layout,
  Orders/Products navigation, active-route styling, responsive behavior,
  loading/error/empty states, and route transitions matching the references.
  The shared layout, placeholder routes, root redirect, active navigation,
  mobile navigation, and reduced-motion-aware CSS transitions are implemented.
  Web lint, TypeScript, build, and desktop/mobile browser review pass.
  Redux/RTK Query is connected without duplicated server data. Orders renders
  real API data with loading, error/retry, empty, and background-refresh states.
  Frontend tests cover these behaviors, cache reuse, selection/panel closing,
  deletion, product retrieval/filtering, and the validated create form.
- [ ] **Build the Orders page.** Show names, counts, dates in two formats,
  and totals in both currencies. Selection opens a closable side panel;
  cancellation preserves data, confirmed deletion updates affected caches,
  and deleting the selected order leaves no stale panel.
  The API-backed summary list, counts, both date formats, and both currency
  totals are implemented. Selection through titles/icons, row highlighting,
  and a closable panel showing associated product titles are verified.
  The panel opens/closes immediately and stacks below the list on narrower
  screens. Product rows show placeholder icons, titles, serial numbers, and
  new/used condition. The header has a labeled close-icon button with hover
  and keyboard-focus styles; desktop closing is verified. Row delete buttons
  open a native modal with the order title and cascading-deletion explanation.
  Confirmed deletion uses RTK Query, removes the deleted order from the
  cached list, and invalidates affected order queries. Pending requests block
  duplicate submission and dismissal. Errors preserve data and allow retry;
  success closes the deleted order's panel while preserving other selections.
  Automated coverage includes populated/empty/last-order deletion, HTTP/network
  failures, retry, and failed list refresh after deletion. Browser review remains
  pending because the Safari automation connection was unavailable.
  Order row data and its delete action now use separate layout columns; removed
  the compact delete button's absolute positioning and excess reserved space.
  Browser review of the layout correction remains pending for the same reason.
- [ ] **Build the Products page.** Display all required fields and associated
  order titles. One type select filters products; resetting restores all
  products and empty results show a clear message.
  API-backed rows, both price currencies, UTC warranty dates in two formats,
  associated order titles, server-side type filtering/reset, and loading/error/
  empty states are implemented and covered by eight product tests. Type options
  remain available while filtering. Order deletion updates all cached product
  lists, including filtered lists, even if refresh fails. Browser review remains.
- [ ] **Demonstrate form validation.** Implement the agreed small inventory
  form and its API endpoint. Frontend and backend reject invalid input,
  errors remain understandable, and successful submission refreshes data.
  POST /api/products and an inline form in the selected order panel are
  implemented. Both layers validate strings, dates/order, and decimal prices.
  Pending controls, cancellation, failures/retry, successful persistence, and
  refreshing products/counts/totals are covered. API checks pass: 26 unit,
  20 database/HTTP, and two Socket.io tests; web checks pass: 66 tests. Browser review remains
  pending because native browser automation is unavailable.
- [ ] **Implement the clock and active-session counter.** Time updates
  automatically. Socket.io counts connected tabs on the server and broadcasts
  changes; opening, closing, refreshing, and reconnecting tabs work without
  permanently duplicated sessions or event listeners.
  Header components display Russian local date/time and server counts from
  `sessions:count`. The server tracks socket IDs in memory; disconnected clients
  are removed and temporary transport failures trigger client reconnection.
  Pending/disconnected UI hides stale counts. Clock and counter effects clean
  up on unmount; header components persist during client-side navigation.
  Eight frontend and three gateway unit tests pass. Two integration tests verify
  broadcasts, closing, refresh/replacement, and automatic reconnection using
  real polling and WebSocket clients. Both apps pass lint, type checks, and
  production builds; the running API serves products and Socket.io handshakes.
  Browser review remains pending because native browser automation is unavailable.

## Junior+ requirements — included in delivery

Implement this entire section after verifying the core inventory behavior and
before final deployment/submission. The feature designs below are project
decisions for demonstrating the PDF's technologies.

- [x] **TypeScript.** Both applications use typed models, API inputs/responses,
  and component contracts. Type checking and production builds pass. Preserve
  these guarantees while adding the remaining features.
- [x] **Unit tests.** Vitest and React Testing Library cover inventory behavior,
  validation, errors, clock updates, and session counting. The verified suite
  includes 66 frontend tests and 26 backend unit tests. Add behavioral tests
  alongside each remaining feature; integration tests supplement unit coverage.
- [ ] **Actual SSR with Next.js.** Initial HTML contains real inventory data.
  Hydration and RTK Query caching/mutations preserve counts, filtering, and
  deletion/creation behavior. Verify initial HTML and client-side navigation;
  installing Next.js or rendering a static shell does not complete this item.
  Orders SSR is implemented: request-time uncached API fetch, streamed inventory
  markup, one-time RTK Query initialization per store, and client retry fallback.
  Thirteen added tests verify fetching, hydration without duplicate list requests,
  request isolation, failures, and preservation of mutations during navigation.
  Existing creation coverage also uses an SSR-initialized list. Web lint, type
  checks, 66 tests, and production build pass. Production HTTP verification found
  all four API order titles in four actual HTML rows, outside script payloads.
  Products SSR and actual browser navigation review remain.
- [ ] **Internationalization (i18n).** Provide Russian and Ukrainian translations
  for navigation, inventory UI, forms, validation, connection/error/empty states,
  dates, prices, and accessible labels. Russian remains the default. Switching
  languages updates the HTML language and preserves the current application state.
- [ ] **Web Storage.** Persist a non-sensitive preference, such as the selected
  language or product type, across reloads. Restore it without hydration errors;
  missing, invalid, or unavailable storage must not break the application.
  Keep credentials and JWTs out of Web Storage.
- [ ] **JWT authentication.** Add a small login/logout flow and protect inventory
  mutations on the server. Use hashed passwords and expiring, validated JWTs
  with an HttpOnly cookie and appropriate protection for cookie-authenticated
  writes. Verify unauthenticated/expired/invalid-token requests and logout.
  Document evaluator access; configure secrets outside Git. Keep registration,
  complex roles, and unrelated account management outside this feature.
- [ ] **Charts.** Show a chart of product counts by type using actual inventory
  data. Creation/deletion updates the figures; empty/error states and an
  accessible textual equivalent are available. Verify the values against the API.
- [ ] **Maps.** Display an office location on an interactive map with a marker
  and a readable address. Use configurable, clearly identified demo coordinates;
  provide an accessible address fallback and handle map-loading failures.
  Document external map/tile requirements and attribution; do not add delivery
  tracking or require browser geolocation.
- [ ] **Lazy loading.** Defer a meaningful noncritical feature, such as the chart
  or office map. Show a loading state and verify its code loads on demand and
  still works after client-side navigation. Confirm actual bundle/network
  behavior rather than counting ordinary route splitting as sufficient evidence.

## Release and delivery

- [ ] **Complete behavioral tests and automated checks.** Configure frontend
  Vitest/React Testing Library and CI. Verify totals, filtering, selection,
  deletion confirmation/cancellation, validation, API errors, and socket
  connection tracking. Both applications pass applicable checks.
  Frontend Vitest/React Testing Library is configured; Orders fetching tests
  pass. CI and remaining feature coverage are planned. Review the existing
  ESLint dependency-chain advisory reported by npm audit before submission.
- [ ] **Package the full environment with Docker Compose.** Web, API, and
  MySQL start with `docker compose up --build`. Migrations and seed setup are
  documented, database data persists, and configuration uses environment
  variables rather than production credentials in source files.
- [ ] **Deploy and finish the README.** The evaluator can access the live
  application. Document prerequisites, environment variables, startup,
  migrations/seeding, API, sockets, tests, deployment, and known limitations.
  Verify browser REST and WebSocket connectivity in the deployed environment.
- [ ] **Perform the submission review.** Start from a fresh clone using the
  README; manually check routes, reference layouts, long titles, empty data,
  error handling, deletion, multiple tabs, and the schema import in MySQL
  Workbench. Record the deployed demo video,
  add demo/video links, review Git history, and complete developer sign-off.
