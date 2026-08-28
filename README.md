# Invoice Creation App

Internal web app for drafting customer invoices, submitting them, and exporting a PDF.

Repository: `bitbirr/invoice-creation-app`

## Architecture decision

Standalone **Next.js 16** (App Router) + **PostgreSQL** + **Prisma 6** app. Money is integer cents. The server recomputes totals; PDFs are generated from persisted rows with `pdf-lib`.

This is **not** an extension of Supplier Invoice Tracker (human-confirmed standalone). See `docs/adr/0001-reuse-decision.md`.

Confirmed product defaults:

- Currency `ETB`
- Invoice-level tax `15%` Ethiopian VAT (`TAX_RATE_BPS=1500`)
- Invoice numbers assigned on submit: `INV-YYYY-NNNNNN`
- Submitted invoices are immutable
- Login required (`AUTH_EMAIL` / `AUTH_PASSWORD` / `AUTH_SECRET`)

Full write-up: `docs/ARCHITECTURE.md`.

## MVP

1. Invoice form with customer/billing details
2. Line items (description, quantity, unit price)
3. Auto-calculated subtotal, tax, total
4. Save draft and submit
5. PDF export
6. Validation and errors
7. Login

Out of scope: customer CRM, email, payments, accounting, reporting, post-submit edits.

## Local setup

Application only. Postgres create/migrate/secrets are owned by the n8n DevOps workflow — see `docs/N8N_DEVOPS_PROMPT.md`.

```bash
cp .env.example .env
# set AUTH_* and DATABASE_URL (provided by DevOps)
npm install
npx prisma generate
npm run dev
```

Open http://localhost:3000 — you will be redirected to `/login`.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm test` | Unit tests (money, tax, validation, numbering) |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |
| `npx prisma migrate dev` | Create/apply migrations in development |
| `npx prisma migrate deploy` | Apply migrations (CI/prod) |

## Documentation

- `docs/ARCHITECTURE.md` — stack and component interaction
- `docs/MVP_PLAN.md` — phased plan
- `docs/DATABASE.md` — schema
- `docs/API.md` + `docs/openapi.yaml` — HTTP contract
- `docs/RISKS.md` — risks and mitigations
- `docs/REPOSITORY.md` — tree
- `docs/N8N_DEVOPS_PROMPT.md` — copy-paste prompt for the n8n DevOps agent
- `docs/adr/` — decisions

## Deployment notes

- DevOps (n8n) owns Postgres, `prisma migrate deploy`, and secret injection.
- Application agents do not provision databases.
- Do not merge or deploy without human review.
