# Invoice Creation App

Internal tool for drafting, submitting, and exporting customer invoices.

**Repository:** `bitbirr/invoice-creation-app`

## Architecture decision

Standalone Next.js app. Do **not** extend Supplier Invoice Tracker.

Supplier Invoice Tracker is an accounts-payable workflow (invoices received from vendors). This app is accounts-receivable (invoices we issue to customers). Reusing that product would force one schema and lifecycle to serve opposite document directions.

This is a **mobile-first React web app** (Next.js App Router + Tailwind), not a React Native app. PDF generation, server-authoritative totals, and internal desktop+phone use fit a responsive web client.

Full write-up: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Stack

| Layer | Choice |
| --- | --- |
| UI | Next.js 16 App Router, React 19, Tailwind CSS 4 |
| API | Next.js Route Handlers |
| Validation | Zod, shared by API and submit path |
| Money | Integer minor units (cents) + milli-quantities |
| Persistence | PostgreSQL 16 + Prisma 6 |
| PDF | `pdf-lib` from persisted invoice snapshots |
| Tests | Vitest for calculation rules |

## Local setup

```bash
cp .env.example .env
npm install
npm run db:up
npm run db:migrate
npm run db:seed
npm test
npm run dev
```

App: http://localhost:3000

Set `APP_ACCESS_TOKEN` in production so `/api/*` requires `Authorization: Bearer <token>`. Leave it empty only for local development.

## MVP scope

In:

- Customer/billing fields on the invoice
- Repeatable line items
- Draft save and explicit submit
- Server-side totals and tax
- PDF export of persisted data

Out until separately approved:

- Accounting integrations, payments, email send
- Customer master-data CRM
- Multi-entity tax engines
- User accounts / SSO (optional shared-token gate only)

## Docs

1. [Architecture](docs/ARCHITECTURE.md)
2. [MVP plan](docs/MVP_PLAN.md)
3. [API](docs/API.md)
4. [OpenAPI](docs/openapi.yaml)
5. ADRs in `docs/adr/`
