import { NextRequest } from "next/server";
import { DomainError, handleRouteError, jsonOk } from "@/lib/http";
import { fieldErrors, submitSchema } from "@/lib/validation";
import { submitInvoice } from "@/server/invoices";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = submitSchema.safeParse(body);
    if (!parsed.success) {
      throw new DomainError(
        "VALIDATION_FAILED",
        "Fix the highlighted fields.",
        400,
        fieldErrors(parsed.error),
      );
    }
    const invoice = await submitInvoice(id, parsed.data.version);
    return jsonOk(invoice);
  } catch (error) {
    return handleRouteError(error);
  }
}
