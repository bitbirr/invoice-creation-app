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
| currency | char(3) | e.g. EUR |
| taxRateBps | int | e.g. 2100 = 21% |
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

Initial SQL: `prisma/migrations/20260828153000_init/migration.sql`.

Apply locally: `npm run db:migrate` (or `npx prisma migrate deploy` in CI/prod).
