export class DomainError extends Error {
  readonly code: string;
  readonly status: number;
  readonly fields?: Record<string, string>;

  constructor(
    code: string,
    message: string,
    status = 400,
    fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "DomainError";
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}

export function jsonError(
  status: number,
  code: string,
  message: string,
  fields?: Record<string, string>,
) {
  return Response.json(
    { error: { code, message, ...(fields ? { fields } : {}) } },
    { status },
  );
}

export function jsonOk(data: unknown, status = 200) {
  return Response.json({ data }, { status });
}

export function handleRouteError(error: unknown) {
  if (error instanceof DomainError) {
    return jsonError(error.status, error.code, error.message, error.fields);
  }
  if (error instanceof SyntaxError) {
    return jsonError(400, "INVALID_JSON", "Request body must be valid JSON.");
  }
  console.error(error);
  return jsonError(500, "INTERNAL_ERROR", "Something went wrong. Your data was not changed.");
}
