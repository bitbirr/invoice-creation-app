import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma } from "@/lib/db";
import { fromUnknown, jsonError } from "@/lib/http";
import { createInvoiceService } from "@/lib/invoice-service";

type RouteContext = { params: Promise<{ id: string }> };

const submitSchema = z.object({
  version: z.number().int().positive().optional(),
});

export async function POST(request: Request, context: RouteContext) {
  const prisma = getPrisma();
  if (!prisma) {
    return jsonError(503, "database_unavailable", "DATABASE_URL is not set.");
  }
  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const { version } = submitSchema.parse(body);
    const invoice = await createInvoiceService(prisma).submit(id, version);
    if (!invoice) return jsonError(404, "not_found", "Invoice not found");
    return NextResponse.json({ invoice });
  } catch (error) {
    return fromUnknown(error);
  }
}
