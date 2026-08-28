# ADR 0001: Standalone customer invoice app

- Status: Proposed
- Date: 2026-08-28

## Context

The charter notes a similar project, Supplier Invoice Tracker, and asks whether to extend it. The Planner made reuse the first implementation gate.

## Decision

Build a **standalone** customer-invoice application in `bitbirr/invoice-creation-app`.

## Reasons

1. `bitbirr/supplier-invoice-tracker` is not a GitHub repository (API 404). There is nothing to extend in source control.
2. Customer invoicing (we issue a bill, AR) and supplier-bill tracking (we receive a bill, AP) are inverse domains. Forcing both into one model usually distorts status, numbering, tax, and PDF templates.
3. This repository is empty except for a README, so a new baseline is cheap.

## Consequences

- If a real SIT codebase is later linked, pause feature work and write a follow-up ADR before duplicating PDF or money utilities.
- Do not add supplier, PO, or AP entities to this schema.
