# Technical architecture

Internal, mobile-first web app for creating customer invoices: draft entry, server-authoritative totals, submit, and PDF export.

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| UI | Next.js 16 App Router, React 19, Tailwind 4 | Matches the Planner’s web proposal and the mobile-first React request in #ceo |
| API | Route Handlers in `src/app/api` | Versioned HTTP contract in-repo; no separate backend for MVP |
| Domain | Pure TypeScript in `src/lib` | Same calculation rules for live preview and persistence |
| DB | PostgreSQL 16 + Prisma 6 | Transactional submit + numbering; Prisma 6 avoids Prisma 7 adapter setup |
| PDF | `pdf-lib` (Node) | Deterministic, no Chromium |
| Auth | Env credentials + HMAC session cookie | Human-confirmed login required ([ADR 0005](./adr/0005-auth.md)) |

## Components

```
Browser (invoice form)
    │  live preview via src/lib/invoice-calc.ts (non-authoritative)
    ▼
Next.js Route Handlers  ──►  src/server/invoices.ts
    │                              │
    │                              ├─ validate (Zod)
    │                              ├─ calculate (shared lib)
    │                              ├─ persist (Prisma, transactions)
    │                              └─ render PDF from persisted row
    ▼
PostgreSQL
    Invoice + LineItem + InvoiceSequence
```

- **Pages:** `/login`, `/` list, `/invoices/new` create, `/invoices/[id]` edit (draft) or view (submitted).
- **API:** see [API.md](./API.md). Handlers are thin; they do not contain tax math.
- **Company identity:** environment variables, snapshotted onto each invoice.
- **Auth:** middleware requires a session except `/login` and `POST /api/auth/login`.

## What this revision changes vs the Planner

Agreed: Next.js + PostgreSQL + Prisma; server-authoritative money; draft/submit; PDF from persisted data; keep CRM/email/payments/reporting out.

Disagreed or tightened:

1. **Reuse spike is not a scaffold blocker.** This mandate can only inspect `bitbirr/invoice-creation-app`. Org search found no Supplier Invoice Tracker repo. Standalone scaffold proceeds; reuse stays a human override ([ADR 0001](./adr/0001-reuse-decision.md)).
2. **Prisma 6, not 7.** Classic client, simpler Next.js integration ([ADR 0002](./adr/0002-stack.md)).
3. **Integer cents**, not Prisma `Decimal` ([ADR 0003](./adr/0003-money-tax-numbering.md)).
4. **Customer snapshot on the invoice**, no customer master table (Planner excluded CRM).
5. **Mobile-first UI** from the #ceo React request.
6. **Auth is a pre-deploy gate, not MVP code.** Internal tool; no public internet assumption until confirmed.

## Out of scope (MVP)

Customer directory, email send, payments, accounting export, multi-tax, multi-currency FX, post-submit edit/void, SSO, reporting dashboards.
