# Risks

| Risk | Mitigation |
| --- | --- |
| Duplicate product vs Supplier Invoice Tracker | ADR-0001: no tracker repo found on GitHub; standalone AR app. Revisit if source appears. |
| Blank repo / no conventions | This scaffold + CI + ADRs. Do not treat proposed stack as pre-existing mandate. |
| Tax/rounding producing wrong invoices | Integer minor units, half-up, centralized `src/lib/money.ts`, boundary tests. Approve rate and examples in Phase 0. |
| Client/server total divergence | Browser preview is UX only. Server recomputes and persists. PDF uses persisted values. |
| Submitted invoice mutation | Draft-only PATCH. Submit freezes snapshot. `voided` exists in the enum but has no UI until a correction policy is approved. |
| Concurrent submit / double click | Transactional sequence increment, unique `invoice_number`, idempotent submit for already-submitted rows, UI disable while pending, `version` checks. |
| PDF differs across runtimes | `@react-pdf/renderer` (no Chromium). Test long text and many lines before release. |
| Auth scope expansion | Shared-secret optional gate only. SSO/Supabase Auth is a later ADR. |
| Shared BitBirrAI Postgres collision | All objects live in schema `invoice`. |
| Broad Asana tasks, no dates | Map them onto Phases 0–5 in `docs/MVP_PLAN.md` and assign owners after approval. |
| Parallel “mobile first React” request in #ceo | This app is that UI surface (responsive Next.js). Do not start a second Vite/RN codebase for the same MVP. |
