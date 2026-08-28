# Invoice Creation App

Internal customer invoicing: capture billing details and line items, save drafts, submit an immutable snapshot, and export a PDF from **server-persisted** totals.

**Repository:** `bitbirr/invoice-creation-app`

## Architecture decision

Standalone **Next.js (App Router) + TypeScript + PostgreSQL + Prisma** web app. Mobile-first UI. Money is integer minor units. Tax is integer basis points. Submitted invoices are immutable. PDF is generated from persisted data, not from the browser.

See `docs/ARCHITECTURE.md` for the full picture. ADRs live in `docs/adr/`.

## Local setup

```bash
cp .env.example .env
docker compose up -d
npm install
npx prisma migrate deploy
npx prisma generate
npm test
npm run dev
```

Open http://localhost:3000

If `INTERNAL_APP_TOKEN` is set, API calls must send `Authorization: Bearer <token>`. Leave it empty for local development.

## What is in MVP

- Invoice form: customer/billing fields + repeating line items
- Draft save and explicit submit
- Server-authoritative line/subtotal/tax/total
- PDF export
- Validation and actionable errors

## What is out of MVP

Accounting integrations, payments, email sending, customer master data, advanced tax regimes, reporting dashboards.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm test` | Domain calculation and lifecycle tests |
| `npm run lint` | ESLint |
| `npx prisma migrate dev` | Create/apply migrations |
