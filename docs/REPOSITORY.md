# Repository structure

```
.
|-- docs/          architecture, API, ADRs, OpenAPI
|-- prisma/        schema, seed, SQL migrations
|-- src/app/       Next.js UI + /api route handlers
|-- src/components/
|-- src/domain/    money + totals (no I/O)
|-- src/lib/       prisma, zod, dto
|-- src/server/    invoice service + PDF
|-- docker-compose.yml
|-- .env.example
`-- .github/workflows/ci.yml
```
