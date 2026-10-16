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
The last verified frontend suite contains 81 tests; no application code changed
during this workflow review. These checks do not claim pixel-perfect matching or
replace the final deployed-environment review.
