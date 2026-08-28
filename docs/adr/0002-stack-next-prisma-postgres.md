# ADR 0002: Next.js App Router, PostgreSQL, Prisma

- Status: Proposed
- Date: 2026-08-28

## Context

The Planner proposed Next.js / PostgreSQL / Prisma. A separate #ceo message asked for a mobile-first React invoice app.

## Decision

- One Next.js 15 (App Router) TypeScript app with Route Handlers as the API.
- PostgreSQL 16 + Prisma for persistence.
- Mobile-first React UI with Tailwind. Not React Native, Expo, or a client-only SPA.

## Reasons

- Server-authoritative totals, lifecycle transitions, and PDF generation need a trusted server. A SPA-only or RN app would still need this backend.
- Internal use favors a URL in the browser (including phones) over an app-store client.
- Prisma + Postgres matches a small relational invoice model (header/lines, unique numbers, transactions).

## Consequences

- Deploy as one web service plus a Postgres instance.
- Shared `calculateInvoice` runs in the browser for feedback and on the server for writes.
