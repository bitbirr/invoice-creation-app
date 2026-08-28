# ADR 0002 — Next.js App Router, PostgreSQL, Prisma 6

## Status

Accepted for MVP.

## Context

The Planner draft proposed Next.js / PostgreSQL / Prisma. A later Slack message asked for a mobile-first React app. The repository was empty aside from a README.

Prisma 7 is current but requires a new datasource config (`prisma.config.ts`) and client adapter wiring. That churn does not help an empty-repo bootstrap.

## Decision

- Next.js (App Router, TypeScript, Tailwind) as a **mobile-first web** client
- PostgreSQL 16
- Prisma **6.x** (classic `DATABASE_URL` in `schema.prisma`)
- Route Handlers for a documented HTTP contract
- Node runtime (not Edge) so Prisma and `pdf-lib` work

## Consequences

- One deployable web app, no separate frontend/backend repositories
- Local development uses `docker compose` for Postgres
- Native iOS/Android is explicitly out of MVP
