# Orders & Products — Web

Next.js App Router frontend with a shared header and navigation for Orders
and Products. `/` redirects to `/orders`. The `/orders` and `/products` pages
currently show labeled placeholders; fetching and feature interactions are
planned.

The application interface is in Russian, using the reference labels
"Приходы" and "Продукты". The HTML language is `ru`; accessible labels and
page metadata follow the same language.

Bootstrap 5 CSS provides shared utilities, with custom SCSS and BEM classes.
The sidebar becomes horizontal navigation below 768px. Active routes are
highlighted and page-entry animations respect reduced-motion preferences.
The root layout and pages use Server Components; the sidebar uses
`usePathname` in a Client Component for active-route styling. This stage does
not yet demonstrate SSR of inventory data.

## Development

```bash
npm ci
npm run dev
```

Open http://localhost:3000. No API connection is required to inspect this
layout stage. Date/time, active-session counting, and RTK Query integration
will be added in later steps.

## Checks

```bash
npm run lint
npm run build
```
