# ADR 0001 — Standalone app, reuse remains a human override

## Status

Accepted for this scaffold (reversible before first production data).

## Context

The project vision notes an existing “Supplier Invoice Tracker” and asks whether this app should extend it instead of duplicating work. The Planner’s first implementation step was a reuse spike against that product.

This Architect run is only authorized to clone, inspect, and write `bitbirr/invoice-creation-app`. GitHub search for `org:bitbirr invoice` returned only this repository. No Supplier Invoice Tracker GitHub repo was found to inspect.

This repository is empty aside from a placeholder README, and it is already chartered as its own GitHub project.

## Decision

Proceed with a **standalone customer-receivable invoice app** in this repository.

Do **not** block scaffolding on a cross-repo spike that cannot be completed from this mandate.

If a human later confirms that Supplier Invoice Tracker can cleanly support customer invoices (direction, access model, PDF, deployment), discard or freeze this scaffold and replace the plan with a delta against that product.

## Consequences

- We avoid waiting on an uninspectable dependency.
- Duplicate-product risk stays open until a human records a final go/no-go.
- Domain here is **customer invoices (receivable)**, not supplier bills (payable).
