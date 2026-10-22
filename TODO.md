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
- [x] **Build the Orders page.** Show names, counts, dates in two formats,
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
  failures, retry, and failed list refresh after deletion. Safari desktop/320px
  review verified lists, long titles, associated products, the modal, and cancellation.
  Safari also verified confirmed deletion of a temporary populated QA order,
  automatic panel closing, and no stale order/product rows after route navigation.
  Database comparison confirmed cascading deletion and unchanged original records.
  Order row data and its delete action now use separate layout columns; removed
  the compact delete button's absolute positioning and excess reserved space.
  Safari desktop review verified the corrected layout and separate delete column.
- [x] **Build the Products page.** Display all required fields and associated
  order titles. One type select filters products; resetting restores all
  products and empty results show a clear message.
  API-backed rows, both price currencies, UTC warranty dates in two formats,
  associated order titles, server-side type filtering/reset, and loading/error/
  empty states are implemented and covered by eight product tests. Type options
  remain available while filtering. Order deletion updates all cached product
  lists, including filtered lists, even if refresh fails. Safari desktop/320px
  review verified rows, associations, filtering, and navigation. A browser-created
  QA type was filtered successfully; deleting its order in another tab produced
  the empty-result state on focus, and resetting restored all six original products.
- [x] **Demonstrate form validation.** Implement the agreed small inventory
  form and its API endpoint. Frontend and backend reject invalid input,
  errors remain understandable, and successful submission refreshes data.
  POST /api/products and an inline form in the selected order panel are
  implemented. Both layers validate strings, dates/order, and decimal prices.
  Pending controls, cancellation, failures/retry, successful persistence, and
  refreshing products/counts/totals are covered. API checks pass: 28 unit,
  28 database/HTTP, and two Socket.io tests; web checks pass: 101 tests. Safari
  verified the form layout, required-field errors, cancellation, and successful
  creation. The order panel, count, USD/UAH totals, product list, type options,
  associations, and warranty dates updated correctly. The temporary QA order and
  product were then deleted; all original records matched the pre-check baseline.
- [x] **Implement the clock and active-session counter.** Time updates
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
  Safari verified ticking time, route navigation without extra sessions, and
  the count sequence 1 → 2 → 2 after refreshing → 1 after closing the second tab.

## Junior+ requirements — included in delivery

Implement this entire section after verifying the core inventory behavior and
before final deployment/submission. The feature designs below are project
decisions for demonstrating the PDF's technologies.

- [x] **TypeScript.** Both applications use typed models, API inputs/responses,
  and component contracts. Type checking and production builds pass. Preserve
  these guarantees while adding the remaining features.
- [x] **Unit tests.** Vitest and React Testing Library cover inventory behavior,
  validation, errors, clock updates, and session counting. The verified suite
  includes 112 frontend tests and 28 backend unit tests. Add behavioral tests
  alongside each remaining feature; integration tests supplement unit coverage.
- [x] **Actual SSR with Next.js.** Initial HTML contains real inventory data.
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
  Products now uses the same request-time fetching and one-time cache initialization.
  Fifteen added tests cover fetching/failure recovery, inventory HTML/hydration,
  isolated requests, filtering/reset, and mutation preservation during navigation,
  including mutations before the first Products visit and after cache eviction.
  All 81 web tests, lint, TypeScript, and production build pass. Production HTTP
  verification found six product article rows, all API titles and associated order
  titles outside scripts. Safari verified direct loading and navigation between
  Orders/Products; mutation/navigation combinations are covered by automated tests.
- [x] **Internationalization (i18n).** Provide Russian and Ukrainian translations
  for navigation, inventory UI, forms, validation, connection/error/empty states,
  dates, prices, and accessible labels. Russian remains the default. Switching
  languages updates the HTML language and preserves the current application state.
  Typed dictionaries cover inventory, navigation, forms/validation, connection,
  loading/error/empty states, accessible labels and page metadata. Dates/prices
  use the selected locale. Stored inventory text retains its original language.
  Tests verify HTML language, late streamed metadata, form drafts/errors, filters,
  request/cache preservation, and socket/timer continuity. Safari verified RU/UK
  switching, refresh/navigation titles, forms/errors, filtering, and the 320px UI.
- [x] **Web Storage.** Persist a non-sensitive preference, such as the selected
  language or product type, across reloads. Restore it without hydration errors;
  missing, invalid, or unavailable storage must not break the application.
  Keep credentials and JWTs out of Web Storage.
  `inventory.locale` persists `ru`/`uk` and synchronizes across tabs. Missing,
  invalid, and inaccessible storage are tested; blocked writes retain in-memory
  switching. Russian server/initial hydration snapshots prevent mismatches before
  restoring the saved locale. Safari verified Ukrainian restoration after refresh.
  All 92 web tests, lint, TypeScript, and production build pass.
- [x] **Fix uncached-data navigation insights.** Orders/Products have localized
  route-level `loading.tsx` boundaries below the shared layout. Safari's Next.js
  Navigation Inspector verified each loading shell during paused client navigation
  and the populated list after resuming. No blocking-route insight appeared.
  SSR remains uncached/request-time. A delayed Suspense hydration test and browser
  refresh with saved Ukrainian verify that language restoration remains consistent.
- [x] **JWT authentication.** Add a small login/logout flow and protect inventory
  mutations on the server. Use hashed passwords and expiring, validated JWTs
  with an HttpOnly cookie and appropriate protection for cookie-authenticated
  writes. Verify unauthenticated/expired/invalid-token requests and logout.
  Document evaluator access; configure secrets outside Git. Keep registration,
  complex roles, and unrelated account management outside this feature.
  AuthModule provides login/session/logout, scrypt password verification, expiring
  JWTs in HttpOnly cookies, and trusted Origin/custom-header guards. One configured
  evaluator account keeps the feature small; setup preserves private local access.
  Following the October 18 readability review, auth is stateless: no session
  registry, revocation, login limiter, or refresh tokens. Logout clears the cookie;
  a copied JWT remains valid until expiry, including across API restarts.
  Frontend auth uses standard RTK Query Session tags, without custom cancellation,
  polling, or manual cache writes. The login form uses local React state.
  See [authentication and evaluator access](README.md#login) for the flow,
  deliberate limits, and production HTTPS/same-site deployment requirements.
  Automated checks cover valid/invalid login, protected writes, expiry, JWT
  validation, cookie clearing, trusted headers, and session cache refresh.
  Verified after simplification: 101 web tests, 28 API unit tests, 30 integration
  tests, lint, and both builds. The existing local evaluator login/session/logout
  also passed an HTTP check without inventory changes.
  Safari previously checked the full login/refresh/logout workflow and mobile UI;
  deployment verification remains a release task.
- [x] **Charts.** Show a chart of product counts by type using actual inventory
  data. Creation/deletion updates the figures; empty/error states and an
  accessible textual equivalent are available. Verify the values against the API.
  Products has an expandable inventory statistics panel with a horizontal bar
  chart and readable type/count pairs. It uses the existing unfiltered RTK Query
  data; filtering the list does not change inventory-wide counts. Categories are
  sorted by count, with locale-aware names as the tie-breaker. Labels support
  RU/UK; stored type names remain unchanged. HTML/SCSS bars keep the implementation
  small without another dependency. Five behavioral tests cover aggregation,
  opening/closing, filtering, locales, empty/error/retry states, creation,
  cascading deletion, and a failed refresh after deletion. All 106 web tests,
  lint, TypeScript, and production build pass. Chrome desktop and 320×740 review
  verified readable bars/counts, long labels, RU/UK switching, opening/closing,
  and Orders/Products navigation. Current inventory has 24 products across nine
  types; filtering the list to four monitors leaves the chart total at 24.
  Browser checks only read inventory and change local UI preferences.
- [x] **Maps.** Display an office location on an interactive map with a marker
  and a readable address. Use configurable, clearly identified demo coordinates;
  provide an accessible address fallback and handle map-loading failures.
  Document external map/tile requirements and attribution; do not add delivery
  tracking or require browser geolocation.
  A shared expandable React Leaflet map shows the real Gulliver business centre
  at Sportyvna Square, 1-A, Kyiv, as explicitly identified demo data.
  Coordinates, zoom, and RU/UK addresses are configured in
  `office.config.ts`. The address and external map link render before opening;
  the browser-only map module and tiles load on demand. Tile failures offer
  retry; failed module loading preserves the address/link. Public OpenStreetMap
  tile requirements, attribution, caching, and availability limits are documented
  in the READMEs. Six tests cover fallback SSR, map controls/marker/attribution,
  opening/closing, locale switching, and tile/module failures. All 112 web tests,
  lint, TypeScript, and production build pass. Chrome desktop and 320×740 review
  verified the real map, popup, zoom, RU/UK, and visible attribution. Network
  showed no tile requests before opening and tile requests afterwards.
- [x] **Lazy loading.** Defer a meaningful noncritical feature, such as the chart
  or office map. Show a loading state and verify its code loads on demand and
  still works after client-side navigation. Confirm actual bundle/network
  behavior rather than counting ordinary route splitting as sufficient evidence.
  The chart uses React.lazy/Suspense and mounts only when statistics are opened.
  Production inspection/HTTP verified a separate chart JS chunk absent from the
  initial Products scripts/preloads and their contents. Inventory SSR remains
  intact. Chrome Network on the production build confirmed no chart request
  before opening statistics and one successful JS request afterwards. The
  loading placeholder was observed; navigation away/back and reopening work.
  Network checks used a temporary production server; UI/filter checks used
  the configured localhost:3000 origin. Browser throttling/cache overrides
  were restored after review.

## Release and delivery

- [ ] **Complete behavioral tests and automated checks.** Use frontend
  Vitest/React Testing Library. Verify totals, filtering, selection,
  deletion confirmation/cancellation, validation, API errors, and socket
  connection tracking. Both applications pass applicable checks.
  Frontend Vitest/React Testing Library is configured, with 112 passing tests.
  CI is an optional improvement, not an assignment requirement; prioritize
  Docker and deployment as agreed with the developer. Review the existing
  ESLint dependency-chain advisory reported by npm audit before submission, plus
  the existing API Prisma/driver and Nest CLI dependency advisories found while
  adding JWT. Do not use forced major upgrades as an automatic audit fix.
- [x] **Package the full environment with Docker Compose.** Web, API, and
  MySQL start with `docker compose up --build`. Migrations and seed setup are
  documented, database data persists, and configuration uses environment
  variables rather than production credentials in source files.
  Multi-stage Node 26.7.0 images build web/API from lockfiles. Web uses standalone
  output only for Docker; both application containers run as non-root. Compose
  waits for database/API health and applies committed migrations before API
  startup. Docker evaluator credentials are generated into ignored `.docker/`
  files; secrets and local build artifacts are excluded from build contexts.
  The default stack supports local HTTP. The production override enforces HTTPS
  origin/Secure cookies and removes MySQL's host port; web/API bind to loopback
  for the existing server proxy. A separate Caddy site example is provided.
  Verified linux/amd64 builds, fresh-volume initialization and migrations,
  three healthy services, explicit additive seed, API/filtering, real inventory
  SSR and static assets, login/session/logout, unauthorized writes, product
  creation and cascading deletion in an isolated QA database. Polling/WebSocket
  clients verified connection counts and reconnects. Chrome verified navigation,
  session display, and lazy chart/map assets from the container. Exact records
  survived full Compose down/up; production origin restrictions and Secure
  cookies also passed. Fixed the existing MySQL init script being sourced into
  the main entrypoint: executable permissions isolate its shell options; a new
  volume now starts without container restarts. Both app lints pass. The existing
  local inventory remains at five orders/24 products. Live deployment verification
  is recorded below.
- [x] **Deploy and finish the README.** The evaluator can access the live
  application. Document prerequisites, environment variables, startup,
  migrations/seeding, API, sockets, tests, deployment, and known limitations.
  Verify browser REST and WebSocket connectivity in the deployed environment.
  Deployed October 20, 2026 at https://dzencode-halimurka.online using an isolated
  Compose project, new production credentials and the additive demo seed
  (four orders/six products). All three services are healthy. Existing Caddy
  host networking proxies loopback ports 3000/3001; MySQL has no host port.
  Caddy configuration validation, Let's Encrypt HTTPS and HTTP redirects passed;
  existing hosted sites retain HTTP 200 responses. Live API checks cover inventory
  SSR/filtering, login/session/logout, Secure cookies, write protection, validation,
  product creation and cascading deletion with temporary QA records cleaned up.
  Public Socket.io polling/WebSocket counts, disconnect and new connection checks
  pass. Safari verified navigation, order details, filtering and the session display.
  README includes the live URL and update instructions. The server uses a source
  snapshot without Git metadata; Git-based server updates require repository
  setup in the deployed directory first.
  The server project is under `/home/ubuntu/kaelthas/dzencode-task`, with
  `COMPOSE_PROJECT_NAME=dzencode-task` pinned in the server `.env`.
  Our temporary deployment archives were removed; future uploads must not
  create `.tgz` files. Preserve `/home/ubuntu/arthur/` and other applications'
  Caddy configuration.
- [ ] **Perform the submission review.** Start from a fresh clone using the
  README; manually check routes, reference layouts, long titles, empty data,
  error handling, deletion, multiple tabs, and the schema import in MySQL
  Workbench. Record the deployed demo video,
  add demo/video links, review Git history, and complete developer sign-off.
