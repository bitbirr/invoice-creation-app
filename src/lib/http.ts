import { NextResponse } from "next/server";
import { z } from "zod";

const lineSchema = z.object({
  description: z.string().trim().min(1).max(500),
  quantity: z.string().trim().min(1),
  unitPrice: z.string().trim().min(1),
});

export const invoiceWriteSchema = z.object({
  customerName: z.string().trim().min(1).max(200),
  customerEmail: z.string().trim().max(320).optional(),
  billingAddress: z.string().trim().max(2000).optional(),
  notes: z.string().trim().max(4000).optional(),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  currency: z.string().length(3).default("ETB"),
  taxRateBps: z.number().int().min(0).max(10_000),
  version: z.number().int().positive().optional(),
  lines: z.array(lineSchema).min(1).max(100),
});

export type InvoiceWriteInput = z.infer<typeof invoiceWriteSchema>;

export function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function requireInternalToken(request: Request): NextResponse | null {
  const expected = process.env.INTERNAL_APP_TOKEN;
  if (!expected) {
    return null;
  }
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (token !== expected) {
    return jsonError(401, "unauthorized", "Missing or invalid bearer token");
  }
  return null;
}
