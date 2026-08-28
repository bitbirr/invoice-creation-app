# Technical architecture

## Decision

**Standalone Next.js application** on PostgreSQL, with Prisma as the data layer.

This repository is the product. It is not an extension of Supplier Invoice Tracker.

| Topic | Decision |
| --- | --- |
| Product boundary | New AR invoice issuer, not AP supplier-invoice tracking |
| Client | Mobile-first React **web** app via Next.js App Router |
| Persistence | PostgreSQL 16, one schema, Prisma 6 |
| Money | Integer minor units; never IEEE-754 for totals |
| Authority | Server recomputes and stores totals on every write |
| Lifecycle | `draft` (mutable) → `submitted` (immutable snapshot + number + PDF source) |
| Auth (MVP) | Optional shared `APP_ACCESS_TOKEN`; no user directory |
| PDF | Generated from stored rows with `pdf-lib`, not from the browser DOM |

## Why not extend Supplier Invoice Tracker

The project vision notes a similar Asana/Notion project. The domains still point opposite ways:

- **Supplier tracker:** inbound documents, vendor identity, receipt/approval/payment of bills we owe.
- **This app:** outbound documents, customer billing identity, draft/submit/issue of invoices we send.

Sharing a table named `invoices` would collide on status, numbering, party model, and PDF meaning. A later billing platform can extract shared primitives (money math, PDF layout) after both products exist. MVP reuse of the other product is rejected.

This agent did not clone or modify `supplier-invoice-tracker`. The recommendation is from the stated vision and business rules, not from that codebase.

## Why Next.js web, not React Native

A later #ceo message asked for a "mobile first react app". That is honored as a **responsive web UI**, because:

- Invoice PDFs and server-side totals need a trusted server runtime.
- Internal users will create invoices on phones and laptops.
- React Native would split the PDF/API work into a second native client without MVP benefit.

## Component map

See README and `docs/REPOSITORY.md` for the tree. Browser form → Next.js `/api` → invoice-service → PostgreSQL + pdf-lib.

### UI

- Server Components load lists and existing invoices.
- `InvoiceForm` is a client component: line-item editing, sticky totals bar, save/submit.
- Preview totals use the same `src/domain` functions as the server. They are **not** persisted.

### Domain

Pure TypeScript in `src/domain`. No Prisma, no `fetch`. Vitest covers rounding and VAT examples.

### Data

Prisma models plus CHECK constraints in the SQL migration for lifecycle and non-negative money. Submit allocates `INV-YYYY-NNNNN` under `SELECT … FOR UPDATE` on the year sequence so concurrent submits cannot share a number.

### PDF

`GET /api/invoices/:id/pdf` loads the invoice and issuer snapshot from the database, then renders with `pdf-lib`. Submitted invoices therefore reprint the same numbers that were stored at submit time.

## Deployment shape

Single Next.js deploy (Node runtime, not Edge — Prisma and `pdf-lib` need Node) plus a managed Postgres instance. `docker-compose.yml` is local-only.

## Explicit non-goals

Payments, email delivery, e-invoicing networks, customer CRM, multi-org tenancy, and SSO are extension points only. The schema keeps customer fields **on the invoice** so a customer table can be added later without rewriting submitted snapshots.
