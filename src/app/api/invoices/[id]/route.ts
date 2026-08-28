import { NextRequest } from "next/server";
import { handleRouteError, jsonOk } from "@/lib/http";
import { getInvoice, updateDraft } from "@/server/invoices";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const invoice = await getInvoice(id);
    return jsonOk(invoice);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const invoice = await updateDraft(id, body);
    return jsonOk(invoice);
  } catch (error) {
    return handleRouteError(error);
  }
}
