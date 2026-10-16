# Inventory browser verification

Verified on October 16, 2026 using native Safari on macOS, the local Next.js
development server at `http://localhost:3000`, NestJS at port 3001, and MySQL.
This records the core inventory workflow review; deployment review and final
submission checks remain tracked in [TODO.md](../TODO.md).

## Creation and navigation

The initial database contained four orders and six products. A temporary order,
`QA Safari disposable order` (ID 86), was created directly through Prisma because
the application intentionally has no create-order feature. Its panel initially
showed zero products and zero totals.

The browser form created the following product:

| Field | Value |
| --- | --- |
| Title | QA Safari monitor |
| Type | QA Safari type |
| Serial number | QA-SAFARI-001 |
| Condition | New |
| Warranty | October 16, 2026 – October 16, 2028 |
| USD price | 12.34 |
| UAH price | 506.78 |

Saving closed the form and showed the success message and product in the panel.
The order summary changed to one product, `12,34 USD`, and `506,78 UAH`.
Navigating to Products showed seven products, including the new product with
its correct order, warranty dates, and prices. Its new type appeared in the
select. Selecting it showed one product; resetting to all types restored seven.

## Deletion, empty results, and reset

The original Products tab was left filtered to the temporary type. A second tab
opened Orders and selected the temporary populated order. The delete dialog
identified the order and explained cascading deletion. After explicit user
confirmation, the browser submitted deletion. The list returned to four orders
and the selected panel closed.

In that same tab, navigation to Products showed the six original products;
returning to Orders did not restore the deleted order. Closing that tab returned
to the original filtered Products tab. Its focus refresh showed zero products
and the message `Продукты этого типа не найдены`. The selected type remained
available so the user could reset it. Resetting restored six products.

After deletion, direct database reads matched every original order and product
against the saved pre-check baseline. No product retained the temporary order ID,
and `GET /api/orders/86` returned 404. Auto-increment sequences can advance during
these checks; the original rows were unchanged.

## Other verified behavior

- Desktop and 320px layouts: header, navigation, inventory rows, long titles,
  and order details stacked below the list on the narrow screen.
- Order panel closing, deletion cancellation, empty form errors, and form cancellation.
- Clock updates and active-tab counts: 1 → 2 → 2 after refresh → 1 on close.
- A background Safari tab temporarily lost its socket connection, displayed the
  reconnecting state on return, then recovered to one active session.
- Production HTML was separately compared with the API: four order articles and
  six product articles contained the actual titles outside scripts, including
  associated order titles in product rows.

Automated coverage supplements these browser checks with HTTP/network failures,
pending controls, cache invalidation, stale route payloads, and SSR hydration.
The core workflow review used 81 frontend tests; no application code changed
during that workflow review. These checks do not claim pixel-perfect matching or
replace the final deployed-environment review.

## Localization follow-up

Also verified on October 16 after adding RU/UK dictionaries and language storage:

- Selecting Monitors, then switching RU to UK preserved the two filtered rows.
  Labels, warranty dates, header clock, accessible names, and the tab title changed.
- Refresh restored Ukrainian from storage. Navigation to Orders retained Ukrainian
  and the corresponding page title; late server metadata did not revert the title.
- Opening an order and typing `Draft preserved` in the product form, then submitting
  incomplete fields showed Ukrainian validation messages. Switching to Russian
  preserved the selected order, draft text, and errors while translating the form.
- The form was canceled without saving. No inventory data was created or deleted
  during the localization checks.
- The Ukrainian header, language select, and navigation fit the 320px responsive
  viewport after adjusting mobile spacing. Safari was returned to normal mode
  and Russian was selected at the end of the check.

The updated automated suite contains 92 frontend tests. It supplements browser
checks with HTML `lang` and description updates, blocked/invalid storage,
cross-tab preference events, hydration, and socket/timer continuity.
