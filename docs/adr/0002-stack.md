# ADR 0002 — Next.js App Router + PostgreSQL + Prisma 6

## Status

Accepted as the baseline for this repository.

## Context

The Planner proposed Next.js / PostgreSQL / Prisma as a suggestion, not an observed convention (the repo had no stack). A #ceo request also asked for a simple, mobile-first React invoice app. Other BitBirr web apps have used Next.js; this is a small internal full-stack tool, not a mobile-native product.

Prisma 7 requires driver adapters and a separate config file. That extra surface is not justified for an MVP.

## Decision

- **UI:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4. Mobile-first responsive layout.
- **API:** Next.js Route Handlers under `src/app/api`. Same process as the UI.
- **Persistence:** PostgreSQL 16 with Prisma 6 (`prisma-client-js`).
- **PDF:** `pdf-lib` on the Node server runtime (no headless Chrome).
- **Validation:** Zod 4, shared shapes for HTTP and domain.
- **Tests:** Vitest for money, tax, lifecycle, and numbering rules.

## Consequences

- One deployable unit; no separate backend repo for MVP.
- Server-authoritative calculations live in `src/lib` and `src/server`, imported by both Route Handlers and (for preview only) the client.
- Switching to Prisma 7 later is a contained upgrade, not an architecture change.
