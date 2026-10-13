# Data decisions and API contracts

The source example is `task/app.js`. The Prisma schema and initial migration
implement the storage decisions below. Orders list/detail/deletion and
Products list/detail/type filtering are implemented. Product creation and
forms are planned; the POST row below describes an intended contract.

## Mapping from the assignment example

| Example field | Storage field | Decision |
| --- | --- | --- |
| Order `id` | Order `id` | Auto-incrementing unsigned integer |
| Order `title`, `description` | Same fields | Title up to 255 characters; description is text |
| Order `date` | Order `createdAt` | UTC datetime with milliseconds |
| Order `products` getter | Order `products` relation | Include only products whose `orderId` matches this order |
| Product `order` | Product `orderId` | Required foreign key to one order |
| Product `serialNumber` | Same field, stored as a string | Preserve leading zeros and alphanumeric serials; duplicates are allowed |
| Product `isNew` | Same field, boolean | Convert example 0/1 to false/true |
| Product `photo` | Same field, nullable string | No real image assets are supplied; absent images use null |
| Product `title`, `type`, `specification` | Same fields | Preserve the example information |
| Product `guarantee.start/end` | Product `warrantyStart/End` | UTC datetimes; end must be on or after start |
| Product `price` USD/UAH entries | Product `priceUSD/priceUAH` | Separate `DECIMAL(12,2)` columns; values must be nonnegative |
| Product `price[].isDefault` | Application configuration | UAH is the fixed primary currency, as in the example |
| Product `date` | Product `createdAt` | UTC datetime with milliseconds |

No live currency conversion is performed. Each product stores both prices.
Amounts with more than two fractional digits must be rejected by future API
validation instead of depending on database rounding. Totals are calculated
from the associated products with decimal arithmetic, not JavaScript floats.

The MySQL server and runtime adapter use UTC. API dates will use ISO 8601
strings ending in `Z`; the frontend will format them for the selected locale.
MySQL `DATETIME` itself does not retain a timezone, so UTC is an application
convention applied at every write/read boundary.

Deleting an order cascades to all of its products. This is our implementation
decision; the PDF does not prescribe it. Confirmation UI must make this
consequence clear. Products of other orders remain untouched.

## REST response contracts

Successful JSON responses use a `{ "data": ... }` envelope. IDs are numbers,
`isNew` is a boolean, and monetary values are decimal strings with two digits
after the decimal point, including totals. Use Prisma Decimal's `toFixed(2)`
when building response DTOs; do not rely on its default JSON representation.

| Endpoint | Intended response |
| --- | --- |
| `GET /api/orders` | Order summaries: `id`, `title`, `description`, `createdAt`, `productCount`, `totalUSD`, `totalUAH` |
| `GET /api/orders/:id` | The summary plus its `products` array |
| `DELETE /api/orders/:id` | `204 No Content` after successful cascading deletion |
| `GET /api/products` | Product fields plus `order: { id, title }` |
| `GET /api/products?type=Monitors` | Products of the selected type; no substring search |
| `GET /api/products/:id` | One product plus `order: { id, title }` |
| `POST /api/products` | Created product, `201 Created`; supports the small validation form |

The implemented list route sorts by `createdAt` descending, then `id`
descending, and returns summaries without product-detail arrays. Only the
prices of each order's associated products are fetched for its calculations.

The detail route returns the same summary plus only that order's products,
sorted by `createdAt` descending, then `id` descending. Each product includes
`id`, `orderId`, `title`, `type`, `serialNumber`, `isNew`, `photo`,
`specification`, `warrantyStart`, `warrantyEnd`, `priceUSD`, `priceUAH`, and
`createdAt`. Photos may be null. Dates and money use the serialization rules
above. Route IDs must be integers from 1 to 4294967295, matching MySQL's
unsigned integer range; invalid IDs are rejected before database access.

The deletion route performs one database delete filtered by the unique order
ID. Foreign-key cascading removes associated products atomically. No matching
order returns 404, including repeated deletion. Successful deletion returns
204 with no body; it does not use the JSON envelope. Other orders and their
products are preserved. The planned UI must request deletion only after the
user confirms the dialog describing the cascade.

Product list/detail responses include the same product fields as order
details plus `order: { id, title }`. Lists sort by `createdAt` descending,
then `id` descending. Product IDs use the same unsigned integer validation
as order IDs. Missing products return 404.

The optional `type` query is trimmed. Omitting it or providing a blank value
returns all products. A supplied type uses equality matching, not substring
search, following MySQL's case/accent insensitive `utf8mb4_unicode_ci`
collation. Unknown types return `data: []`. Values must be a single string
with at most 100 characters after trimming; repeated type values and unknown
query parameters return 400 before database access. Removing the filter
restores the full collection. Cascaded products no longer appear in these
responses.

An empty order has `productCount: 0` and totals of `"0.00"`; empty collections
return `data: []`. Missing resources return 404, invalid IDs/inputs return 400,
and server errors must not expose credentials or internal database details.

## Planned validation form

Use one small create-product form associated with a selected existing order.
Require a title, type, serial number, valid warranty dates, and both prices.
Support `isNew`, specification, and an optional image URL; use an empty
specification when omitted. `createdAt` is assigned by the server.

Validate required/trimmed strings and storage lengths, positive order IDs,
the referenced order's existence, actual dates and warranty ordering,
nonnegative prices, a maximum of two fractional digits, and the storage range
of `DECIMAL(12,2)`. Repeat relevant validation on frontend and backend.
No additional edit forms, order-creation flow, or authentication is planned
as part of this database stage.

## Development seed and schema artifact

The seed inserts four demo orders and six products across Monitors, Keyboards,
and Accessories. Order 3 is empty; fixtures include long titles, both new and
used products, and fractional prices. Product images are null.

Fixed demo IDs and `createMany({ skipDuplicates: true })` make repeated seed
runs additive: existing rows are neither deleted nor overwritten. Run the
seed only when demo data is wanted. Changing fixture values does not update
existing demo rows automatically.

`database/schema.sql` concatenates the ordered migration SQL, including
custom CHECK constraints, for importing into an empty reference database or
MySQL Workbench's SQL-script reverse engineering. Regenerate it with
`npm --prefix apps/api run db:schema:export` after adding/changing migrations.
Application setup uses Prisma Migrate, not this reference export.

## Connection configuration

Prisma CLI reads `DATABASE_URL` and `SHADOW_DATABASE_URL` from `apps/api/.env`.
The runtime and seed load the same file without overriding process variables.
Both Prisma packages and the MySQL adapter use version 7.10.0.

The runtime adapter accepts plain `mysql://user:password@host:port/database`
URLs and decodes percent-encoded credentials. URL query options are explicitly
rejected; production TLS/driver configuration will be added during deployment.

The development MySQL image creates `${MYSQL_DATABASE}_shadow` on its first
startup and gives the application user privileges only on its application
database and shadow database. Container initialization scripts run only when
the data volume is empty. If configuring the shadow database on an existing
development volume, run:

```bash
docker compose exec -T mysql sh /docker-entrypoint-initdb.d/init-shadow.sh
```

Never point `SHADOW_DATABASE_URL` at the application database: Prisma Migrate
recreates the shadow schema while checking migrations.
