# ADR 0001 — Standalone app, not Supplier Invoice Tracker

## Status

Accepted for MVP, pending human confirmation.

## Context

Project vision: create a simple internal invoice creation app, and consider extending Supplier Invoice Tracker instead of duplicating it.

## Decision

Build a new application in `bitbirr/invoice-creation-app`.

Do not put customer-invoice issuance into the supplier tracker.

## Consequences

- Two products may later share libraries (money math, PDF chrome) but not a database.
- Duplicate visual "invoice" concepts are accepted as cheaper than a distorted AP+AR hybrid.
- If a human later proves the tracker already has a clean customer-invoice module, this ADR can be reversed before Phase 1 is merged.
