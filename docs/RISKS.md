# Risks

| Risk | Mitigation |
| --- | --- |
| Duplicate product vs Supplier Invoice Tracker | Recorded as [ADR 0001](./adr/0001-reuse-decision.md). Human go/no-go before production data. This scaffold is disposable if reuse wins. |
| Empty repo / no conventions | This PR sets stack, layout, lint, tests, CI, and ADRs. |
| Wrong tax/currency/rounding | Defaults documented as assumptions. One calculation module + unit tests. Change via env + ADR, not scattered UI math. |
| Client vs server totals diverge | Preview uses the same TS functions; persist/PDF use server recomputation only. |
| Destructive submit / duplicate numbers | Transactional state machine; number assigned once; double-submit is idempotent; optimistic `version`. |
| PDF differs across environments | `pdf-lib` + standard fonts; generated from persisted row; no browser print CSS. |
| Internal billing data exposed | Auth is an explicit pre-deploy gate. Do not put this on a public URL until that gate is closed. |
| Scope creep | CRM, email, payments, accounting, reporting stay out. Fractional qty and post-submit edits need a new ADR. |
| Timeline/budget | Phase 0 timeboxed. Re-estimate if auth or tax compliance is added. |
| Prisma 7 / adapter churn | Pinned Prisma 6 for MVP ([ADR 0002](./adr/0002-stack.md)). |
| Integer quantity too strict | Called out in ADR 0003; migrate to milli-quantity later if needed. |
