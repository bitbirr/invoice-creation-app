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
| Runtime | Railway + `{project_key}.bitbirr.net` | Provisioned by n8n, not by the coding agent |
| Secrets | Infisical (`https://secrets.jigjigapay.com`) | Source of truth; Railway syncs env from Infisical |
| Data host | Self-hosted Supabase Postgres (`https://db.jigjigapay.com`) | One database/schema per app; see [N8N_DEVOPS_PROMPT.md](./N8N_DEVOPS_PROMPT.md) |

Architect Agent emits `docs/devops-handoff.json` and stops. n8n continues from that JSON ([ARCHITECT_CONTINUATION.md](./ARCHITECT_CONTINUATION.md)).

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
6. **Login is required.** Env credentials + session cookie ([ADR 0005](./adr/0005-auth.md)). Provisioning of `AUTH_*` and `COMPANY_*` is n8n/Infisical, not this repo.

## Out of scope (MVP)

Customer directory, email send, payments, accounting export, multi-tax, multi-currency FX, post-submit edit/void, SSO, reporting dashboards.
