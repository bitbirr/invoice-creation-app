# ADR 0003 — Integer minor units, invoice-level tax, number on submit

## Status

Accepted as working defaults. Currency, tax rate, and legal invoice requirements still need human confirmation before production use.

## Decision

### Money

Store all money as **integer minor units** (cents). Never use IEEE-754 floats for persisted or authoritative totals.

- Line total = `quantity * unitPriceCents` (exact).
- Subtotal = sum of line totals.
- Tax = round-half-up of `subtotalCents * taxRateBps / 10_000`.
- Grand total = subtotal + tax.

Quantity is a **positive integer** in MVP (no fractional hours/kg). Documented as a later change if needed.

### Tax

Single **invoice-level** rate in basis points (`taxRateBps`). Default `2100` (21%) via `TAX_RATE_BPS`, matching a common NL VAT rate for BitBirr.nl — this is an assumption, not a compliance claim.

No per-line tax, exemptions, reverse charge, or multi-jurisdiction logic in MVP.

### Currency

ISO 4217 code, default `EUR` via `CURRENCY`. One currency per invoice; no FX.

### Numbering

Drafts have `number = null`. On submit, assign `INV-{UTC year}-{6-digit sequence}` using `InvoiceSequence` inside the same transaction as the status change. Numbers are unique and never reused.

### Seller identity

Copied from environment onto the invoice row at create and refresh-copied on each draft save so submitted PDFs snapshot the seller as it was at submit time.

## Consequences

- Browser preview can call the same TypeScript functions, but only the server persist/submit result is stored and exported.
- Changing tax or currency policy later requires a migration and a documented cutover; submitted invoices keep their snapshots.
