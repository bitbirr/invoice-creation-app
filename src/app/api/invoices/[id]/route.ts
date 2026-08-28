import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { fromUnknown, jsonError } from "@/lib/http";
import { createInvoiceService } from "@/lib/invoice-service";
import { invoiceWriteSchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

function requireDb() {
  const prisma = getPrisma();
  if (!prisma) {
    return {
      error: jsonError(
        503,
        "database_unavailable",
        "DATABASE_URL is not set. Start Postgres and copy .env.example to .env.",
      ),
    };
  }
  return { service: createInvoiceService(prisma) };
}

export async function GET(_request: Request, context: RouteContext) {
  const db = requireDb();
  if ("error" in db && db.error) return db.error;
  try {
    const { id } = await context.params;
    const invoice = await db.service!.get(id);
    if (!invoice) return jsonError(404, "not_found", "Invoice not found");
    return NextResponse.json({ invoice });
  } catch (error) {
    return fromUnknown(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const db = requireDb();
  if ("error" in db && db.error) return db.error;
  try {
    const { id } = await context.params;
    const body = await request.json();
    const input = invoiceWriteSchema.parse(body);
    const invoice = await db.service!.updateDraft(id, input);
    if (!invoice) return jsonError(404, "not_found", "Invoice not found");
    return NextResponse.json({ invoice });
  } catch (error) {
    return fromUnknown(error);
  }
}
