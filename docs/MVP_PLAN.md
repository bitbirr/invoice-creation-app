# MVP implementation plan

Phased, each slice shippable. Human review of this PR is the gate for Phase 0/1 landing on `main`.

## Phase 0 — Decisions (this PR)

- [x] Standalone app, not an extension of Supplier Invoice Tracker
- [x] Next.js + PostgreSQL + Prisma 6
- [x] Mobile-first web UI rather than React Native
- [x] Integer minor-unit money, 15% default tax (1500 bps), half-up rounding
- [x] Draft/submit lifecycle; submitted invoices immutable
- [ ] Confirm issuer legal name, tax ID, default currency if not ETB
- [ ] Confirm whether production must have `APP_ACCESS_TOKEN` before first use

## Phase 1 — Foundation (this PR)

- [x] Next.js app scaffold, Tailwind, CI
- [x] Prisma schema and initial migration
- [x] Domain calculation module + Vitest
- [x] Invoice CRUD API, submit transition, PDF endpoint
- [x] Mobile-first create/edit/list UI and issuer settings

Still required after merge:

1. Provision Postgres (or use `npm run db:up` locally).
2. `npm run db:migrate && npm run db:seed`
3. Set issuer profile on `/settings`

## Phase 2 — Hardening (next implementation slice)

- Pagination and search on the invoice list
- PDF: pagination, long descriptions, many line items, custom font for ETB/Amharic if needed
- Idempotency keys on POST create (in addition to idempotent submit)
- Structured field errors mapped onto the form
- Backup/restore notes for Postgres

## Phase 3 — Release

- Hosting + managed Postgres
- Enable `APP_ACCESS_TOKEN` or replace with real auth
- Run calculation tests in CI (already wired) and a smoke path: create → save → submit → PDF
- Document operational numbering (what happens at year rollover — already year-scoped)

## Out of MVP

Accounting export, payment collection, emailing PDFs, customer master data, multi-currency FX, void/credit-note workflow (add only with an explicit correction policy).
