# Orders & Products

A full-stack inventory management application developed for the dZENcode
Junior+ React.js technical assessment.

## Current status

The repository currently contains cleaned Next.js and NestJS application
skeletons. The frontend root page is intentionally blank. The backend starts
without application endpoints, so requests to `/api` currently return 404.

Orders, products, database integration, validation forms, and the live session
counter are planned. See [TODO.md](TODO.md) for the implementation checklist.

## Technology stack

- **Frontend:** Next.js App Router, React, TypeScript; Redux Toolkit/RTK Query,
  Bootstrap 5, SCSS with BEM, Lucide React, and Socket.io Client are installed
  for upcoming features.
- **Backend:** NestJS with ESM and TypeScript; Prisma, validation libraries,
  and Socket.io are installed for upcoming features.
- **Database:** MySQL is planned; no schema, migrations, or seed exists yet.
- **Testing:** Backend Vitest configurations exist, with no test files yet.
  Frontend Vitest and React Testing Library setup is planned.
- **Infrastructure:** Docker Compose and production deployment are planned.

## Repository structure

```text
apps/
  web/                  Next.js frontend
  api/                  NestJS backend
database/               Reserved for the MySQL Workbench schema
task/                   Original assignment, example data, and UI references
TODO.md                 Development and delivery checklist
.nvmrc                  Pinned Node.js version
docker-compose.yml      Empty placeholder; not usable yet
```

Each application has its own npm manifest and lockfile. Run npm commands
inside the corresponding application directory or use `npm --prefix` as below.

## Prerequisites

- Node.js **26.7.0**, pinned in `.nvmrc` and used for the initial verification.
- npm **11.19.0**, used for the initial verification.
- Git.

MySQL and Docker are not required to run the current application skeletons.

If you use nvm, select the pinned version from the repository root:

```bash
nvm install
nvm use
```

## Local development

Clone the repository and install dependencies from the committed lockfiles:

```bash
git clone https://github.com/kxardas/dzencode-task.git
cd dzencode-task
npm --prefix apps/web ci
npm --prefix apps/api ci
```

Start the frontend in one terminal:

```bash
npm --prefix apps/web run dev
```

Open http://localhost:3000. A blank page is expected at this stage.

Start the backend in another terminal:

```bash
npm --prefix apps/api run start:dev
```

The backend listens on port 3001 by default, uses the `/api` prefix, and
allows CORS requests from http://localhost:3000. A 404 response from
http://localhost:3001/api is expected until endpoints are implemented.

## Environment variables

Examples are provided in `apps/web/.env.example` and `apps/api/.env.example`.
Default settings are sufficient to start the current skeletons.

| Application | Variable | Current role |
| --- | --- | --- |
| API | `PORT` | Read from the process environment; defaults to `3001` |
| API | `DATABASE_URL` | Reserved for upcoming MySQL/Prisma integration |
| API | `FRONTEND_URL` | Reserved; CORS currently uses the localhost URL in bootstrap |
| Web | `NEXT_PUBLIC_API_URL` | Reserved for upcoming REST requests |
| Web | `NEXT_PUBLIC_SOCKET_URL` | Reserved for upcoming Socket.io integration |

The API does not yet load `.env` files automatically. Set `PORT` in the shell
when overriding it. API environment-file loading will be added with database
configuration. The frontend supports Next.js environment files; copy its
example to `.env.local` when frontend integrations are implemented.

Example credentials are for local development only. Local environment files
are ignored by Git.

## Checks and production builds

Run these commands from the repository root:

```bash
npm --prefix apps/web run lint
npm --prefix apps/web run build
npm --prefix apps/api run lint
npm --prefix apps/api run build
```

After building, start the applications in separate terminals:

```bash
npm --prefix apps/web run start
```

```bash
npm --prefix apps/api run start:prod
```

Backend test commands are `npm --prefix apps/api test` and
`npm --prefix apps/api run test:e2e`. They currently report no test files
and exit with a nonzero status; demo tests were removed during cleanup.

## Remaining setup and delivery

Prisma CLI and Client versions still need alignment before database work.
The Docker Compose file is an empty placeholder; `docker compose up --build`
is not available yet. Database setup, API contracts, live WebSocket behavior,
deployment instructions, live demo and video links will be documented as
their corresponding features are implemented and verified.
