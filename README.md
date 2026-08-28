# Invoice Creation App

Internal app for drafting, submitting, and (later) exporting customer invoices as PDF.

**Stack:** Next.js 15 (App Router) · React 19 · PostgreSQL 16 · Prisma · decimal.js

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for architecture, MVP plan, schema, API, and risks.

## Quick start

```bash
cp .env.example .env
npm install
docker compose up -d
npx prisma generate
npx prisma migrate deploy
npm test
npm run dev
```

- UI: http://localhost:3000
- New invoice (mobile-first form): http://localhost:3000/invoices/new
- Health: http://localhost:3000/api/health

Totals preview works without Postgres (`POST /api/invoices/preview`). Saving a draft requires the database.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm test` | Calculation policy tests |
| `npm run lint` | ESLint |
| `npm run dev` | Next.js dev server |
| `npm run db:up` | Local Postgres |

## Out of scope (MVP)

Accounting integrations, payments, email delivery, customer master data, and multi-entity tax.
