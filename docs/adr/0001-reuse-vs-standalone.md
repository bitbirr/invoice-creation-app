# ADR-0001: Standalone customer-invoice app

Date: 2026-08-28
Status: Proposed

## Context

The project vision notes that a similar project "Supplier Invoice Tracker" already exists and asks whether to extend it instead of duplicating work.

## Decision

Build a **standalone customer-invoice (AR)** application in `bitbirr/invoice-creation-app`.

## Reasons

- `bitbirr/supplier-invoice-tracker` is not a GitHub repository (API 404).
- Org search did not find another dedicated customer-invoice app.
- Supplier invoices (accounts payable / bills received) and customer invoices (accounts receivable / bills issued) invert the parties, numbering, tax presentation, and PDF letterhead. Extending an AP tracker into AR usually distorts both domains.
- Existing PHP ERP modules (e.g. SalesERP supplier-return screens) are the wrong stack and product for this internal MVP.

## Consequences

- This repo owns the customer-invoice UX, schema, API, and PDF.
- If tracker source is later provided and already has a generic, well-tested invoicing core, this ADR should be revisited **before** Phase 2 data is treated as production.

## Alternatives considered

- Extend tracker in-place: blocked on missing source; domain mismatch likely.
- Extract a shared invoicing library: too much process for a 2–3 week internal MVP.
