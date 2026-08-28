# Database design

PostgreSQL schema name: `invoice` (safe to colocate later on the shared BitBirrAI project).

Money columns are `BIGINT` minor units. Quantity is `INTEGER` milli-units (1000 = 1). Tax rate is `INTEGER` basis points (1500 = 15.00%).

```
issuer_profiles 1─── (config only; not a per-invoice FK in MVP)
invoices 1───* line_items
invoice_number_sequences  (year PK → last_value)
```

## invoices

| Column | Type | Notes |
| --- | --- | --- |
| id | text cuid | PK |
| status | enum draft/submitted/voided | default draft |
| invoice_number | text unique nullable | set on submit: `INV-YYYY-NNNN` |
| issue_date | date | |
| currency | char(3) | ISO 4217 |
| tax_rate_bps | int | 0–10000 |
| customer_name | text | denormalized; no CRM table |
| customer_email | text nullable | |
| billing_address | text nullable | |
| notes | text nullable | |
| subtotal_minor | bigint | server-computed, >= 0 |
| tax_minor | bigint | server-computed, >= 0 |
| total_minor | bigint | server-computed, >= 0 |
| version | int | optimistic concurrency |
| submitted_at | timestamptz nullable | |
| snapshot | jsonb nullable | frozen document used for PDF |

## line_items

| Column | Type | Notes |
| --- | --- | --- |
| id | text cuid | PK |
| invoice_id | text | FK cascade |
| position | int | display order |
| description | text | |
| quantity_milli | int | > 0 |
| unit_price_minor | bigint | >= 0 |
| line_total_minor | bigint | persisted snapshot of `round(qty * price)` |

## invoice_number_sequences

One row per calendar year. Submit increments `last_value` in the same transaction that stamps `invoice_number`.

## Constraints

Check constraints reject negative money, empty quantities, and tax bps outside 0–10000. Unique `invoice_number`. Index `(status, created_at)` for the list page.

## Why customer fields are on the invoice

MVP excludes customer master-data management. Billing details are a snapshot of what was on the form at save/submit time, which is also what the PDF must reprint.
