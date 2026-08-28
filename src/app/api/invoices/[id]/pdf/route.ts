import { renderToBuffer } from "@react-pdf/renderer";
import { jsonError, requireInternalToken } from "@/lib/http";
import { prisma } from "@/lib/db";
import { InvoicePdf } from "@/lib/pdf/invoice-document";
import { formatMinor, milliToQuantity } from "@/lib/money";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const unauthorized = requireInternalToken(request);
  if (unauthorized) return unauthorized;

  const { id } = await context.params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { lineItems: { orderBy: { position: "asc" } } },
  });
  if (!invoice) {
    return jsonError(404, "not_found", "Invoice not found");
  }

  const lines = invoice.lineItems.map((line) => ({
    description: line.description,
    quantity: milliToQuantity(line.quantityMilli),
    unitPrice: formatMinor(line.unitPriceMinor, invoice.currency),
    lineTotal: formatMinor(line.lineTotalMinor, invoice.currency),
  }));

  const document = InvoicePdf({
    number: invoice.invoiceNumber ?? "DRAFT",
    status: invoice.status,
    issueDate: invoice.issueDate.toISOString().slice(0, 10),
    customerName: invoice.customerName,
    customerEmail: invoice.customerEmail,
    billingAddress: invoice.billingAddress,
    currency: invoice.currency,
    lines,
    subtotal: formatMinor(invoice.subtotalMinor, invoice.currency),
    tax: formatMinor(invoice.taxMinor, invoice.currency),
    total: formatMinor(invoice.totalMinor, invoice.currency),
    taxRateBps: invoice.taxRateBps,
    notes: invoice.notes,
  });
  // react-pdf's DocumentProps typing does not match React 19's ReactElement.
  const buffer = await renderToBuffer(document as never);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.invoiceNumber ?? "draft"}.pdf"`,
    },
  });
}
