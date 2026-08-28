# MVP implementation plan

Phased, each slice shippable (domain → API → UI). Do not start Phase 2 until Phase 0 is explicitly approved.

## Phase 0 — Decision gate (day 0–1)

- Confirm standalone build (ADR-0001). Provide Supplier Invoice Tracker source if reuse should still be evaluated.
- Approve money/tax/numbering/immutability (ADR-0003).
- Approve auth minimum: empty token for LAN/VPN vs `INTERNAL_APP_TOKEN` vs later SSO.
- Approve default currency and tax bps.

## Phase 1 — Foundation (days 1–2) — this PR

- Next.js + Tailwind + Prisma + docker-compose Postgres
- Domain money/totals/lifecycle + tests
- OpenAPI contract and ADRs
- CI: `npm test` + `tsc`

## Phase 2 — Persistence and lifecycle (days 2–5)

- Apply migration to a real database
- Seed a single issuer profile
- Harden submit: transaction, sequence row lock, idempotent re-submit of an already-submitted invoice
- Optimistic concurrency via `version`

## Phase 3 — Creation workflow UI (days 4–8)

- Mobile-first form polish (delete line, better errors, disabled submit while in-flight)
- Draft list and detail
- Server error mapping to field-level messages

## Phase 4 — PDF export (days 7–10)

- Replace the placeholder letterhead with approved issuer details
- Pagination, long descriptions, 50+ line items
- Golden-file or hash test against a fixture snapshot

## Phase 5 — Harden and handoff (days 10–15)

- Boundary tests for rounding, tax=0, max lines, concurrent submit
- README deploy notes (VPS/Traefik or Railway)
- Do not merge to main or deploy without human approval

## Explicitly not in this MVP

Payments, emailing PDFs, accounting export, customer directory, multi-entity, multi-tax, recurring invoices, dashboard analytics.
