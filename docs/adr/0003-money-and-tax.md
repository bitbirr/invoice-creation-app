# ADR 0003 — Integer money and tax rounding

## Status

Accepted for MVP. Tax rate default is Ethiopia VAT 15% (1500 bps) because the issuer is BitBirr; change on `/settings` if wrong.

## Context

Invoice totals must match PDFs and later accounting. IEEE-754 `number` is unsafe for currency.

## Decision

- Store money as `BIGINT` minor units (cents). Assume 2 decimal ISO currencies (ETB, USD, EUR).
- Store quantity as `DECIMAL(12,3)` and convert to milli-units (x 1000) in domain code.
- Line total = half-up(quantityMilli * unitPriceMinor / 1000)
- Subtotal = sum of rounded line totals
- Tax = half-up(subtotalMinor * taxRateBps / 10000)
- Grand total = subtotal + tax
- Browser may preview using the same functions; the server recomputes on save and submit and persists those values

## Consequences

- API read model exposes minor-unit strings; write model accepts major-unit decimal strings
- Multi-currency FX and 0/3-decimal currencies are out of scope
- Changing rounding later would require a new submitted-invoice generation, not rewriting old snapshots
