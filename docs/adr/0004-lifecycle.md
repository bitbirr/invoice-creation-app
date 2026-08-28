# ADR 0004 — Draft / submitted lifecycle

## Status

Accepted.

## Decision

Two states only: `DRAFT` and `SUBMITTED`.

| Action | DRAFT | SUBMITTED |
| --- | --- | --- |
| Create | yes | — |
| Update fields / lines | yes | no (409) |
| Submit | yes → SUBMITTED, number assigned, totals recomputed, seller snapshotted | idempotent: return existing invoice |
| PDF | allowed, labelled DRAFT | allowed, uses persisted values |
| Delete | not in MVP | not in MVP |

Submit requirements:

- Customer name non-empty after trim.
- At least one line item.
- Each line: non-empty description, quantity ≥ 1, unitPriceCents ≥ 0.
- Server recomputes all monetary fields; client totals are ignored.

Optimistic concurrency: updates and submit require the current `version`. Mismatch returns 409 `VERSION_CONFLICT`.

Post-submit correction/voiding is **out of scope**. If needed later, add an explicit credit-note or void flow rather than mutating submitted invoices.

## Consequences

- PDFs for submitted invoices are reproducible from the row.
- Double-submit is safe (idempotent).
- Humans must approve if they need edits after submit.
