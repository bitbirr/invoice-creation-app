# Risks

| Risk | Mitigation in this repo |
| --- | --- |
| Duplicate product vs Supplier Invoice Tracker | ADR 0001 rejects reuse for MVP; reverse only with human proof the other app already issues customer invoices cleanly. |
| Empty-repo convention drift | Scaffold + CI (`npm test`, `npm run lint`) + ADRs checked in with the code. |
| Wrong tax/rounding | Integer math, documented half-up policy, Vitest examples including 15% VAT. |
| Client/server total drift | UI preview is labeled as preview; save/submit always recomputes on the server and stores snapshots. |
| Submitted invoice mutation | CHECK constraint + service-level 409; PDF reads stored rows. |
| Concurrent submit / double number | Year sequence row locked `FOR UPDATE`; unique `invoices.number`; submit is idempotent. |
| PDF differs in production | `pdf-lib` + standard fonts; Phase 2 must test long text, many lines, and Amharic if required. Standard Helvetica cannot render Ethiopic — flag before promising Amharic PDFs. |
| Auth expands scope | Optional bearer token only. No SSO in MVP. |
| Asana tasks are broad | Map them onto Phase 1–3 in `docs/MVP_PLAN.md`. |
| Prisma 7 config break | Pinned Prisma 6.x for classic `DATABASE_URL` in schema. |

## Residual product questions

1. Default currency ETB and 15% VAT — confirm.
2. Whether submitted invoices may ever be voided.
3. Whether Amharic legal names must appear on the PDF (requires embedding a font).
4. Production access model (shared token vs Google/Microsoft SSO vs VPN-only).
