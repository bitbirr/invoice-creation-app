# ADR 0003 — Integer minor units, ETB, 15% Ethiopian VAT

## Status

Accepted (human-confirmed 2026-08-28).

## Decision

### Money

Store all money as **integer minor units** (santim / cents). Never use IEEE-754 floats for persisted or authoritative totals.

- Line total = `quantity * unitPriceCents` (exact).
- Subtotal = sum of line totals.
- Tax = round-half-up of `subtotalCents * taxRateBps / 10_000`.
- Grand total = subtotal + tax.

Quantity is a **positive integer** in MVP.

### Tax

Single invoice-level rate. Default **`TAX_RATE_BPS=1500` (15%)**, Ethiopian VAT standard, confirmed by the product owner.

No per-line tax, exemptions, reverse charge, or multi-jurisdiction logic in MVP.

### Currency

**`CURRENCY=ETB`**. One currency per invoice; no FX.

### Numbering

Drafts have `number = null`. On submit, assign `INV-{UTC year}-{6-digit sequence}`.

### Seller identity

Copied from `COMPANY_*` environment variables onto the invoice at create/save. Production values are injected by the n8n DevOps workflow, not hardcoded.

## Consequences

- Existing docs/tests that mentioned EUR / 21% are superseded.
- Submitted invoices keep the tax/currency snapshot stored on the row.
