# API design

Base path: `/api`. JSON in and out. Amounts over the wire are **decimal strings in major units** on write (`"12.50"`) and **decimal strings of minor units** on read (`subtotalMinor: "1250"`) until the OpenAPI examples are implemented in clients. Current handlers serialize persisted minor units as strings to avoid JSON number precision loss.

Optional header: `Authorization: Bearer <INTERNAL_APP_TOKEN>` when the env var is set.

Idempotency: `Idempotency-Key` on `POST /api/invoices/{id}/submit`. Re-submitting an already submitted invoice returns the existing invoice (no second number).

## Endpoints

### `GET /api/invoices`

List latest 50 invoices, newest first.

### `POST /api/invoices`

Create a **draft**. Server computes totals.

```json
{
  "customerName": "Acme Trading",
  "customerEmail": "ap@acme.example",
  "billingAddress": "Bole, Addis Ababa",
  "issueDate": "2026-08-28",
  "currency": "ETB",
  "taxRateBps": 0,
  "notes": "",
  "lines": [
    { "description": "On-site networking", "quantity": "2", "unitPrice": "1500.00" }
  ]
}
```

`201` with `{ invoice }`. Client-supplied totals are ignored if present.

### `GET /api/invoices/{id}`

Single invoice including line items.

### `PATCH /api/invoices/{id}`

Replace draft fields and lines. Rejects `status != draft` (`400`) and stale `version` (`409`).

### `POST /api/invoices/{id}/submit`

Body: `{ "version": 1 }`. Assigns `invoice_number`, recomputes totals from stored lines, writes `snapshot`, sets `submitted`.

### `GET /api/invoices/{id}/pdf`

`application/pdf` attachment generated from persisted data.

## Error shape

```json
{ "error": { "code": "validation_error", "message": "quantity must be greater than zero" } }
```

Codes: `validation_error`, `domain_error`, `not_found`, `unauthorized`.

Machine-readable contract: `docs/openapi.yaml`.
