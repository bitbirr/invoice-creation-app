import { NextResponse } from "next/server";
import { calculateInvoice } from "@/lib/invoice-calc";
import { fromUnknown, jsonError } from "@/lib/http";
import { invoicePreviewSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = invoicePreviewSchema.parse(body);
    const totals = calculateInvoice({
      taxRateBps: input.taxRateBps,
      lineItems: input.lineItems,
    });
    return NextResponse.json({ currency: input.currency, ...totals });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return jsonError(400, "invalid_json", "Body must be JSON");
    }
    return fromUnknown(error);
  }
}
