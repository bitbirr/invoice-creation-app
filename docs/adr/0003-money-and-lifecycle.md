# ADR 0003: Money, tax, numbering, and lifecycle

- Status: Proposed (numeric policy needs human confirmation)
- Date: 2026-08-28

## Decision

### Money

- Compute with `decimal.js` (`ROUND_HALF_UP`).
- Persist `DECIMAL(19,4)`; **expose and round to 2 decimal places**.
- API JSON uses decimal strings, never floats.

### Line and tax math

1. `lineTotal = round(quantity * unitPrice, 2)`
2. `subtotal = sum(lineTotal)`
3. `taxTotal = round(subtotal * taxRateBps / 10000, 2)`
4. `grandTotal = subtotal + taxTotal`

Default tax rate: **1500 bps (15%)**. Stored per invoice so later issuer-default changes do not rewrite history.

### Lifecycle

```
DRAFT -> SUBMITTED -> VOID
```

- Drafts are editable (PATCH) and have no public `invoiceNumber`.
- Submit assigns `INV-YYYY-NNNN`, snapshots totals, sets `submittedAt`. Repeat submit is idempotent.
- Submitted rows are immutable. Corrections: VOID with reason, then a new invoice.
- `version` is incremented on each write; stale PATCH/submit returns 409.

## Consequences

- Changing rounding or tax after invoices exist requires a new ADR and must not rewrite submitted snapshots.
- Vitest in `src/lib/invoice-calc.test.ts` is the executable spec for the math.
