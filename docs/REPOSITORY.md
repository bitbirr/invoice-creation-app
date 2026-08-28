# Repository structure

```
.
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── DATABASE.md
│   ├── MVP_PLAN.md
│   ├── RISKS.md
│   ├── openapi.yaml
│   └── adr/                 # architecture decision records
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── app/                 # pages + Route Handlers
│   │   ├── api/invoices/
│   │   ├── invoices/new/
│   │   └── invoices/[id]/
│   ├── components/          # mobile-first UI
│   ├── lib/                 # money, tax, calc, validation, pdf (shared)
│   └── server/              # Prisma-backed invoice use cases
├── docker-compose.yml
├── .env.example
└── .github/workflows/ci.yml
```

Conventions:

- Domain math stays in `src/lib`. Route Handlers stay thin.
- Do not persist client-supplied totals.
- Feature work lands in vertical slices (schema + API + UI + tests), not layer-by-layer rewrites.
