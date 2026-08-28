# API design

Base URL: same origin as the web app (`/api`). JSON only, except PDF.

Money fields are **decimal strings in major units** on write (`"150.00"`) and **integer minor-unit strings** on read (`"15000"`). This keeps JSON numbers from becoming floats.

## Auth

If `APP_ACCESS_TOKEN` is set, every `/api/*` route requires:

```
Authorization: Bearer <token>
```

If it is unset, routes are open (local development).

## Endpoints

### `GET /api/issuer`

Returns the singleton issuer profile used on PDFs.

### `PUT /api/issuer`

Replaces issuer profile.

### `GET /api/invoices`

Lists up to 100 invoices, newest first.

### `POST /api/invoices`

Creates a **draft**. Incomplete customer data is allowed. Totals are computed on the server.

### `GET /api/invoices/:id`

### `PATCH /api/invoices/:id`

Updates a draft. Include `version` to fail with `409` on concurrent edits. Submitted invoices return `409`.

### `POST /api/invoices/:id/submit`

Requires `version` plus complete customer name, billing address, and at least one line item.

Effects, in one transaction:

1. Recompute line totals, tax, and grand total
2. Allocate `INV-YYYY-NNNNN` with a row lock
3. Persist monetary and customer snapshots
4. Set `status=submitted`, `submittedAt=now()`

Repeating submit on an already-submitted invoice is **idempotent** and returns the existing record.

### `GET /api/invoices/:id/pdf`

`application/pdf` attachment generated from stored data.

See examples in this file in the repository working copy, and `docs/openapi.yaml`.

| Status | Meaning |
| --- | --- |
| 400 | Validation (Zod) or malformed JSON |
| 401 | Missing/invalid access token |
| 404 | Invoice not found |
| 409 | Concurrent edit, or mutation of a submitted invoice |
| 500 | Unexpected failure; draft rows are not deleted |
