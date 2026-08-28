# Technical architecture

Status: Proposed. Date: 2026-08-28. Target: internal MVP in 2–3 weeks.

This repository was empty (`README.md` only). There were no existing application, database, API, PDF, or test conventions to preserve. This document is the architecture for a **standalone** customer-invoice app in `bitbirr/invoice-creation-app`.

## Decision

**Next.js 15 (App Router, TypeScript) + PostgreSQL 16 + Prisma**, mobile-first UI, integer minor-unit money, server-authoritative totals, draft → submitted lifecycle, PDF from persisted snapshots.

```
Browser (mobile-first form)
        |  HTTPS
        v
Next.js App Router
  UI (RSC + client form)     Route Handlers /api/invoices*
        |                           |
        | live preview only         | authoritative compute
        v                           v
  src/lib/money + totals     Prisma  -->  PostgreSQL schema `invoice`
                                           invoices, line_items,
                                           issuer_profiles,
                                           invoice_number_sequences
        submitted snapshot JSON ----->  @react-pdf/renderer  --> PDF
```

1. The form may preview totals in the browser using the same TypeScript functions the server uses.
2. Create/update/submit always recomputes totals on the server and persists those values. The client cannot set `subtotalMinor` / `taxMinor` / `totalMinor`.
3. Submit is a transactional state change: lock the year sequence, assign `INV-YYYY-NNNN`, freeze a JSON snapshot, mark `submitted`.
4. PDF reads persisted rows / snapshot. It does not trust query-string amounts.

## Revisions vs the Planner draft

Agreed with: blank-repo starting point; Next.js + PostgreSQL; server-authoritative calculations; draft/submit; decimal-safe money; PDF from persisted data; reuse as a decision gate; keep accounting, payments, email, reporting, complex tax, and customer CRM out of MVP.

Tightened after inspecting this repo and the BitBirr GitHub org:

1. **Reuse is not viable from GitHub.** `bitbirr/supplier-invoice-tracker` returns 404. No other org repo is a customer-invoice app. SalesERP has supplier-return PHP screens; that is a different product and stack. This repo proceeds as a **standalone AR (customer invoice) app**. If a human later produces the tracker codebase and it already has a generic invoicing core, revisit ADR-0001 before investing further here.
2. **Prisma, not house Supabase Auth/RLS, for this MVP.** Gym Booking uses Next.js + namespaced Supabase. That is the right house hosting pattern later. It is the wrong first cut here because the Planner explicitly asked to keep identity integration out of MVP, and because a dedicated Prisma schema lets this app run locally with docker-compose without the shared-project mutation workflow. Tables live in PostgreSQL schema `invoice` so they can later move onto BitBirrAI.
3. **Mobile-first Next.js, not a Vite SPA and not React Native.** A parallel #ceo message asked for a “mobile first react app”. This architecture covers that UX (responsive web) while keeping a server for authoritative money and PDF. A separate SPA would duplicate the trust boundary.
4. **Integer minor units + tax basis points**, not IEEE floats and not Prisma `Decimal` in application code. Rounding is half-up at the minor unit, implemented with `bigint`.
5. **Invoice numbers assigned on submit**, not on draft save. Drafts have no public number.

## Major components

| Component | Responsibility |
| --- | --- |
| `src/app` | Mobile-first pages: list, create, detail |
| `src/app/api/invoices` | HTTP contracts; auth gate; persistence |
| `src/lib/money.ts` | Parse/format and half-up integer arithmetic |
| `src/lib/invoice-totals.ts` | Line → subtotal → tax → grand total |
| `src/lib/invoice-lifecycle.ts` | Draft mutability, submit rules, numbering |
| `src/lib/pdf` | Deterministic PDF from persisted values |
| `prisma/schema.prisma` | `invoice` schema, constraints, sequences |
| `docs/openapi.yaml` | Versioned HTTP contract |

## Trust model

- The browser is untrusted for money. Preview is UX only.
- Route Handlers are the trust boundary. They recompute and persist.
- Submitted invoices are immutable. Corrections are a later void-and-reissue policy, not in-place edits.
- Optional `INTERNAL_APP_TOKEN` bearer gate. No end-user identity provider in MVP.

## Assumptions (confirm before production data)

- A1. Internal staff only; no public customer portal.
- A2. Single issuer / single currency per invoice. Default currency ETB, 2 minor digits.
- A3. One invoice-level tax rate in basis points. No per-line tax, exemptions, or withholding in MVP.
- A4. Quantity has up to 3 decimal places (`quantity_milli`).
- A5. Submitted invoices are not edited. Voiding is schema-ready (`voided`) but has no UI yet.

Open questions for a human: tax rate for BitBirr invoices; whether ETB is the only live currency; whether a shared-secret gate is enough vs SSO; PDF letterhead / TIN layout.
