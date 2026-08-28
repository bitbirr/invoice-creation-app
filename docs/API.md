# API design

Base path: `/api`. JSON only (`Content-Type: application/json`) except PDF (`application/pdf`).

No existing Postman/OpenAPI contract was available; this is the source of truth. Machine-readable copy: [openapi.yaml](./openapi.yaml).

## Envelope

Success:

```json
{ "data": { } }
```

Error:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Fix the highlighted fields.",
    "fields": { "customerName": "Customer name is required." }
  }
}
```

`fields` is omitted when the error is not field-scoped.

## Status codes

| Code | When |
| --- | --- |
| 200 | GET, PATCH, idempotent submit |
| 201 | POST create |
| 400 | Validation / malformed JSON |
| 401 | Not logged in (`UNAUTHENTICATED`) or bad login (`INVALID_CREDENTIALS`) |
| 404 | Unknown invoice id |
| 409 | `VERSION_CONFLICT` or update of a submitted invoice (`INVOICE_IMMUTABLE`) |
| 500 | Persistence or PDF failure (draft data is not deleted) |

## Endpoints

### `POST /api/auth/login`

Body: `{ "email": string, "password": string }`. Sets httpOnly session cookie.

### `DELETE /api/auth/login`

Clears the session cookie.

All invoice endpoints below require a valid session (401 otherwise).

### `GET /api/invoices`

List newest first. Optional `?status=DRAFT|SUBMITTED`.

Response `data`: `{ invoices: InvoiceSummary[] }`.

### `POST /api/invoices`

Create a **draft**. Body: `InvoiceWrite` (no `version`). Totals computed on the server.

Response `201` `data`: `Invoice`.

### `GET /api/invoices/{id}`

Full invoice including line items.

### `PATCH /api/invoices/{id}`

Update a draft. Body: `InvoiceWrite` **plus** `version`. Replaces line items as a set.

Rejected if status is `SUBMITTED` or `version` does not match.

### `POST /api/invoices/{id}/submit`

Body: `{ "version": number }`.

- Validates submit rules, recomputes totals, snapshots seller, assigns number, sets `SUBMITTED`.
- If already submitted: **200** with the existing invoice (idempotent).

### `GET /api/invoices/{id}/pdf`

PDF generated from the **persisted** row. Drafts are watermarked `DRAFT`. Filename: `{number or DRAFT}-{id}.pdf`.

## Shared shapes

`InvoiceWrite`:

```ts
{
  customerName: string
  customerEmail?: string | null
  customerAddress?: string | null
  notes?: string | null
  lineItems: {
    description: string
    quantity: number        // integer ≥ 1
    unitPriceCents: number  // integer ≥ 0
  }[]
}
```

`Invoice` includes those fields plus `id`, `status`, `number`, `currency`, `taxRateBps`, seller snapshot, cents totals, `version`, timestamps, and `lineItems` with `id`, `position`, `lineTotalCents`.

Client preview **must** use `src/lib/invoice-calc.ts` and **must not** send totals; the server ignores any total fields.
