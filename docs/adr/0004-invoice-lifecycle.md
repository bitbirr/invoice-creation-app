# ADR 0004 — Invoice lifecycle and numbering

## Status

Accepted for MVP.

## Context

Business rules require save-draft and submit. Mutating a submitted invoice would make PDFs unreproducible.

## Decision

- Statuses: `draft` | `submitted` only
- Drafts have `number = null` and may be incomplete
- Submit is an explicit POST, transactional, and assigns `INV-YYYY-NNNNN` using a per-year sequence row locked with `FOR UPDATE`
- After submit, PATCH is rejected; PDF uses stored snapshots
- Repeat submit is idempotent
- `version` is incremented on each successful write; mismatched version returns 409
- Void/credit notes are not in MVP. If corrections are needed, issue a new invoice after a human policy is approved.

## Consequences

- Users must get the draft right before submit, or create a replacement invoice
- Year change resets the numeric suffix (the year prefix keeps uniqueness)
- No customer master table: name/address live on the invoice so historical PDFs stay stable if a customer later changes address
