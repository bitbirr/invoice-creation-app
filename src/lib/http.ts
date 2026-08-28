import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { MoneyError } from "./money";

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
};

export function jsonError(
  status: number,
  code: string,
  message: string,
  fields?: Record<string, string>,
) {
  const body: ApiErrorBody = { error: { code, message, ...(fields ? { fields } : {}) } };
  return NextResponse.json(body, { status });
}

export function fromUnknown(error: unknown) {
  if (error instanceof ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of error.issues) {
      fields[issue.path.join(".") || "body"] = issue.message;
    }
    return jsonError(400, "validation_error", "Request failed validation", fields);
  }
  if (error instanceof MoneyError) {
    return jsonError(400, "calculation_error", error.message);
  }
  if (error instanceof InvoiceConflictError) {
    return jsonError(error.status, error.code, error.message);
  }
  console.error(error);
  return jsonError(500, "internal_error", "Unexpected server error");
}

export class InvoiceConflictError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 409,
  ) {
    super(message);
    this.name = "InvoiceConflictError";
  }
}
