# Database design

PostgreSQL. Prisma schema: `prisma/schema.prisma`. Money is integer cents. No floating-point columns.

## ER overview

```
InvoiceSequence (year PK, last)
        │  used only on submit
        ▼
Invoice 1 ──< LineItem
```

There is **no Customer table**. Name/email/address are snapshotted on the invoice.

## `Invoice`

| Column | Type | Notes |
| --- | --- | --- |
| id | cuid | PK |
| status | enum `DRAFT` \| `SUBMITTED` | |
| number | text, unique, nullable | Assigned on submit; `INV-YYYY-NNNNNN` |
| currency | char(3) | e.g. ETB |
| taxRateBps | int | e.g. 1500 = 15% |
| customerName | text | Required on submit |
| customerEmail | text? | |
| customerAddress | text? | |
| notes | text? | |
| sellerName/Address/Email/Vat | text | Snapshotted from env |
| subtotalCents, taxCents, totalCents | int | Server-computed, persisted |
| version | int | Optimistic concurrency |
| issueDate | timestamptz? | Set on submit (UTC date of issue) |
| submittedAt | timestamptz? | |
| createdAt, updatedAt | timestamptz | |

Indexes: unique `number`; `(status, createdAt)` for the list page.

## `LineItem`

| Column | Type | Notes |
| --- | --- | --- |
| id | cuid | PK |
| invoiceId | FK | `ON DELETE CASCADE` |
| position | int | Display order, 0-based |
| description | text | |
| quantity | int | ≥ 1 |
| unitPriceCents | int | ≥ 0 |
| lineTotalCents | int | `quantity * unitPriceCents` |

## `InvoiceSequence`

| Column | Type | Notes |
| --- | --- | --- |
| year | int PK | UTC year |
| last | int | Last assigned sequence for that year |

Incremented inside the submit transaction (`INSERT … ON CONFLICT DO NOTHING` then `UPDATE … RETURNING`).

## Constraints to enforce in application + DB

- Submitted invoices must have `number` and `submittedAt` (application).
- Drafts must not have a number (application).
- Totals on write always come from `calculateInvoice`; never trust the client.

## Migrations

The repo contains **three stacked init migrations** from merged scaffolds. Do not rewrite the first two (they are already applied in production):

1. `20260828100000_init` — schema `invoice` (snake_case, unused by the current app).
2. `20260828120000_init` — public `invoices` / `organization_settings` and public `InvoiceStatus` (`DRAFT`, `SUBMITTED`, `VOID`).
3. `20260828153000_init` — tables the app actually uses: `"Invoice"`, `"LineItem"`, `"InvoiceSequence"`. Does **not** recreate `InvoiceStatus` (that caused P3018).

Apply: `npx prisma migrate deploy`.

If `20260828153000_init` is recorded as **failed** (P3018), after this SQL is on the deployed branch:

```bash
npx prisma migrate resolve --rolled-back 20260828153000_init
npx prisma migrate deploy
```

Do not `resolve --applied` for that migration (the app tables were not created). Do not hand-edit tables. Do not drop leftover objects from the first two inits without a backup.
