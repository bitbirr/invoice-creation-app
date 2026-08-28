# ADR-0002: Next.js + PostgreSQL + Prisma

Date: 2026-08-28
Status: Proposed

## Context

Planner proposed Next.js / PostgreSQL / Prisma. House gym-booking work uses Next.js + Supabase (Auth, RLS, namespaced schema). A parallel Slack request asked for a mobile-first React app.

## Decision

Use **Next.js 15 App Router (TypeScript) + PostgreSQL + Prisma** in this repository. UI is mobile-first responsive web. Persistence uses PostgreSQL schema `invoice`.

## Reasons

- One deployable covers UI, API, and PDF. Matches the Planner and the gym-booking "single web app" shape.
- Prisma + docker-compose lets the MVP run without waiting on the shared-project migration workflow or Supabase Auth (identity is out of MVP).
- Schema `invoice` keeps a door open to host on BitBirrAI later without renaming tables.
- Server rendering and Route Handlers are the right place for authoritative money and PDF. A Vite SPA would still need a backend.

## Not chosen

- **Vite + React SPA:** extra service for the trust boundary; worse fit for PDF.
- **React Native / Expo:** out of scope for an internal tool; web is enough if the layout is mobile-first.
- **Supabase Auth + RLS as the first cut:** expands auth scope the Planner asked to defer. Revisit when SSO is required.
- **Puppeteer/Playwright PDF:** heavier runtime and more environment drift. `@react-pdf/renderer` is deterministic enough for invoices.

## Consequences

- Engineers need Node 22, Docker for Postgres, and Prisma migrate.
- Moving onto shared Supabase later is a migration of connection + RLS policies, not a domain rewrite.
