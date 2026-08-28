# Invoice Creation App

Internal web app for drafting customer invoices, submitting them, and exporting a PDF.

Repository: `bitbirr/invoice-creation-app`

## Architecture decision

Standalone **Next.js 16** (App Router) + **PostgreSQL** + **Prisma 6** app. Money is integer cents. The server recomputes totals; PDFs are generated from persisted rows with `pdf-lib`.

This is **not** an extension of Supplier Invoice Tracker. That product was not found as a GitHub repo in the BitBirr org, and this agent is only allowed to work in this repository. Reuse remains a human override — see `docs/adr/0001-reuse-decision.md`.

Working defaults (confirm before production):

- Currency `EUR`
- Invoice-level tax `21%` (`TAX_RATE_BPS=2100`)
- Invoice numbers assigned on submit: `INV-YYYY-NNNNNN`
- Submitted invoices are immutable
- No authentication in MVP (do not expose publicly until that gate is closed)

Full write-up: `docs/ARCHITECTURE.md`.

## MVP

1. Invoice form with customer/billing details
2. Line items (description, quantity, unit price)
3. Auto-calculated subtotal, tax, total
4. Save draft and submit
5. PDF export
6. Validation and errors

Out of scope: customer CRM, email, payments, accounting, reporting, post-submit edits.

## Local setup

Requirements: Node 22, Docker (for Postgres).

```bash
cp .env.example .env
docker compose up -d
npx prisma migrate deploy
npm run dev
```

Open http://localhost:3000

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
- `docs/adr/` — decisions

## Deployment notes

- Set `DATABASE_URL` and seller identity env vars.
- Run `prisma migrate deploy` before or as part of release.
- Keep backups of Postgres; submitted invoices are the source of truth for PDFs.
- Do not merge or deploy without human review.
