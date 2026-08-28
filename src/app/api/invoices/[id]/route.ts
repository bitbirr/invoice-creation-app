import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { invoiceWriteSchema, jsonError, requireInternalToken } from "@/lib/http";
import { assertDraftMutable, assertVersion } from "@/lib/invoice-lifecycle";
import { serializeInvoice, totalsFromWriteInput } from "@/lib/invoice-service";

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
  return NextResponse.json({ invoice: serializeInvoice(invoice) });
}

export async function PATCH(request: Request, context: RouteContext) {
  const unauthorized = requireInternalToken(request);
  if (unauthorized) return unauthorized;

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = invoiceWriteSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "validation_error", parsed.error.issues[0]?.message ?? "Invalid payload");
  }

  const existing = await prisma.invoice.findUnique({ where: { id } });
  if (!existing) {
    return jsonError(404, "not_found", "Invoice not found");
  }

  try {
    assertDraftMutable(existing.status);
    if (parsed.data.version !== undefined) {
      assertVersion(parsed.data.version, existing.version);
    }
    const totals = totalsFromWriteInput(parsed.data);
    const invoice = await prisma.$transaction(async (tx) => {
      await tx.lineItem.deleteMany({ where: { invoiceId: id } });
      return tx.invoice.update({
        where: { id },
        data: {
          issueDate: new Date(parsed.data.issueDate),
          currency: parsed.data.currency,
          taxRateBps: parsed.data.taxRateBps,
          customerName: parsed.data.customerName,
          customerEmail: parsed.data.customerEmail || null,
          billingAddress: parsed.data.billingAddress || null,
          notes: parsed.data.notes || null,
          subtotalMinor: totals.subtotalMinor,
          taxMinor: totals.taxMinor,
          totalMinor: totals.totalMinor,
          version: { increment: 1 },
          lineItems: {
            create: totals.lines.map((line) => ({
              position: line.position,
              description: line.description,
              quantityMilli: line.quantityMilli,
              unitPriceMinor: line.unitPriceMinor,
              lineTotalMinor: line.lineTotalMinor,
            })),
          },
        },
        include: { lineItems: { orderBy: { position: "asc" } } },
      });
    });
    return NextResponse.json({ invoice: serializeInvoice(invoice) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update invoice";
    const status = message.includes("reload") ? 409 : 400;
    return jsonError(status, "domain_error", message);
  }
}
