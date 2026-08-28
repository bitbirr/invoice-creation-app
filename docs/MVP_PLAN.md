# MVP implementation plan

Target: the six accepted capabilities — form, line items, calculations, draft/submit, PDF, validation. Estimate remains 2–3 weeks **after** humans confirm the open domain gates in Phase 0.

## Phase 0 — Human gates (before treating invoices as real)

Timebox: half day.

- [ ] Confirm standalone app vs extend Supplier Invoice Tracker ([ADR 0001](./adr/0001-reuse-decision.md)).
- [ ] Confirm currency (`EUR` default), tax rate (`21%` default), and that integer quantities are acceptable.
- [ ] Confirm submitted invoices are immutable (no void/credit-note in MVP).
- [ ] Confirm access model: internal-only unauthenticated MVP vs required login before any deploy.
- [ ] Confirm seller identity fields for the PDF.

This scaffold implements the defaults so engineering can continue; production use waits on the checks above.

## Phase 1 — Foundation (this PR)

- Repository conventions, README, ADRs, CI (lint / typecheck / unit tests).
- Prisma schema + initial migration.
- Shared money/tax/lifecycle unit tests.
- HTTP contract and Route Handlers.
- Mobile-first draft form, list, submit, PDF download.
- Docker Compose Postgres for local dev.

**Done when:** `npm test`, `npm run lint`, and `npm run typecheck` pass; with Postgres up, a user can create a draft, submit, and download a PDF.

## Phase 2 — Hardening (next PR)

- Playwright (or similar) e2e: create → edit → submit → PDF; double-submit; version conflict.
- Boundary tests already in Vitest expanded for large line counts and long descriptions in PDF pagination.
- Backup/restore and migration notes for the chosen host.
- Optional basic auth / SSO **only if Phase 0 requires it**.

## Phase 3 — Release

- Production Postgres, env for seller identity, CI green on main after human merge.
- Acceptance against only the six capabilities.
- Revisit 2–3 week / $3k–$5k estimates if Phase 0 changed tax, numbering, or auth.

## Explicitly not scheduled

Email, payments, customer master data, accounting integrations, dashboards, multi-entity tax packs.
