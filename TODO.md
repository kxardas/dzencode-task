# Orders & Products — Development Checklist

Target submission: October 25, 2026.

Work in the order below. Add meaningful tests alongside each feature.
Check an item only when its completion criteria have been verified.
The assignment sources are in `task/`; standing project rules are in `AGENTS.md`.
Use feature branches for development after the initial setup commit.

## Implementation and delivery

- [x] **Initialize and clean the application skeletons.** Next.js and NestJS
  exist under `apps/`, generated demos are removed, and both applications
  passed lint and production build after cleanup.
- [x] **Finish the development baseline.** The root README documents
  installation, startup, environment examples, and current limitations.
  Node.js/npm versions are pinned; lockfile installation, lint, build, and
  production startup have been verified for both application skeletons.
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
- [ ] **Build the shared frontend foundation.** Configure Redux Toolkit and
  RTK Query without duplicating server data. Add Bootstrap/SCSS/BEM layout,
  Orders/Products navigation, active-route styling, responsive behavior,
  loading/error/empty states, and route transitions matching the references.
- [ ] **Build the Orders page.** Show names, counts, dates in two formats,
  and totals in both currencies. Selection opens a closable side panel;
  cancellation preserves data, confirmed deletion updates affected caches,
  and deleting the selected order leaves no stale panel.
- [ ] **Build the Products page.** Display all required fields and associated
  order titles. One type select filters products; resetting restores all
  products and empty results show a clear message.
- [ ] **Demonstrate form validation.** Implement the agreed small inventory
  form and its API endpoint. Frontend and backend reject invalid input,
  errors remain understandable, and successful submission refreshes data.
- [ ] **Implement the clock and active-session counter.** Time updates
  automatically. Socket.io counts connected tabs on the server and broadcasts
  changes; opening, closing, refreshing, and reconnecting tabs work without
  permanently duplicated sessions or event listeners.
- [ ] **Complete behavioral tests and automated checks.** Configure frontend
  Vitest/React Testing Library and CI. Verify totals, filtering, selection,
  deletion confirmation/cancellation, validation, API errors, and socket
  connection tracking. Both applications pass applicable checks.
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
