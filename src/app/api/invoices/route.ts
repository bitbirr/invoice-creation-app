import { NextRequest } from "next/server";
import { handleRouteError, jsonError, jsonOk } from "@/lib/http";
import { createDraft, listInvoices } from "@/server/invoices";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get("status");
    if (status != null && status !== "DRAFT" && status !== "SUBMITTED") {
      return jsonError(400, "VALIDATION_FAILED", "status must be DRAFT or SUBMITTED.");
    }
    const invoices = await listInvoices(
      status === "DRAFT" || status === "SUBMITTED" ? status : undefined,
    );
    return jsonOk({ invoices });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const invoice = await createDraft(body);
    return jsonOk(invoice, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
