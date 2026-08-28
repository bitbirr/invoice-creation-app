import { NextRequest } from "next/server";
import { handleRouteError } from "@/lib/http";
import { renderInvoicePdf } from "@/lib/pdf";
import { getInvoice } from "@/server/invoices";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const invoice = await getInvoice(id);
    const bytes = await renderInvoicePdf(invoice);
    const filename = `${invoice.number ?? "DRAFT"}-${invoice.id}.pdf`;
    return new Response(Buffer.from(bytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
