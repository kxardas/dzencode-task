# Orders & Products — Development Checklist

Target submission: October 25, 2026.

Work in the order below. Add meaningful tests alongside each feature.
Check an item only when its completion criteria have been verified.
The assignment sources are in `task/`; standing project rules are in `AGENTS.md`.
Continue ordinary development directly on `main`, as agreed with the developer.
Keep commits small and meaningful; commit/push only when explicitly requested.

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
  Forty-five frontend tests cover these behaviors, cache reuse, selection/panel
  closing, deletion, product retrieval/filtering, and the validated create form.
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
  refreshing products/counts/totals are covered. API checks pass: 23 unit and
  20 database/HTTP tests; web checks pass: 45 tests. Browser review remains
  pending because native browser automation is unavailable.
- [ ] **Implement the clock and active-session counter.** Time updates
  automatically. Socket.io counts connected tabs on the server and broadcasts
  changes; opening, closing, refreshing, and reconnecting tabs work without
  permanently duplicated sessions or event listeners.
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

## Junior+ enhancements — scope to be decided

The PDF does not clarify whether all listed Junior+ tools are required.
Confirm the intended scope and document delivered enhancements and omissions.

- [ ] **Actual SSR.** Initial HTML includes real order/product data; client
  hydration, navigation, and subsequent RTK Query mutations remain correct.
- [ ] **Internationalization.** Agreed languages cover UI labels, validation,
  dates, and prices consistently.
- [ ] **Web Storage.** Persist an agreed UI preference and restore it without
  hydration errors or duplicating server data.
- [ ] **Lazy loading.** Defer a meaningful noncritical component or feature
  and verify its loading state and behavior.

JWT, charts, and maps remain unscheduled until the developer chooses a
relevant use case. TypeScript and unit tests are part of the implementation
checklist above. Do not add unrelated features to tick technology boxes.
