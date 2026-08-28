# ADR-0003: Integer money, submit immutability, numbering

Date: 2026-08-28
Status: Proposed

## Context

Incorrect rounding or post-submit edits make PDFs unreproducible and totals untrustworthy. Planner asked for decimal-safe arithmetic, lifecycle rules, and snapshots.

## Decision

1. Store money as `BIGINT` minor units. Default currency ETB with 2 minor digits. Never use IEEE floats for money.
2. Store quantity as integer milli-units (3 decimal places).
3. Store tax as integer basis points on the invoice, not per line, in MVP.
4. Round half-up to the minor unit using `bigint` division in `src/lib/money.ts`.
5. Drafts are mutable. Submit recomputes totals from stored lines, assigns `INV-YYYY-NNNN`, writes a JSON snapshot, and freezes the row. PATCH after submit is rejected.
6. Invoice numbers are unique. Sequence increment happens in the submit transaction.

## Consequences

- Application code must convert at the HTTP boundary (`"12.50"` ↔ `1250n`).
- Changing tax policy (per-line tax, exemptions) requires a schema additive change.
- Void/reissue is the correction path; it is enum-ready (`voided`) but has no UI until product approves it.

## Test gates

`src/lib/money.test.ts` covers line rounding, tax bps, totals, and lifecycle guards. Phase 4 adds PDF snapshot tests.
