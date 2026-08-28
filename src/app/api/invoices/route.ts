import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { invoiceWriteSchema, jsonError, requireInternalToken } from "@/lib/http";
import { serializeInvoice, totalsFromWriteInput } from "@/lib/invoice-service";

export async function GET(request: Request) {
  const unauthorized = requireInternalToken(request);
  if (unauthorized) return unauthorized;

  const invoices = await prisma.invoice.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { lineItems: { orderBy: { position: "asc" } } },
  });
  return NextResponse.json({ invoices: invoices.map(serializeInvoice) });
}

export async function POST(request: Request) {
  const unauthorized = requireInternalToken(request);
  if (unauthorized) return unauthorized;

  const body = await request.json().catch(() => null);
  const parsed = invoiceWriteSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "validation_error", parsed.error.issues[0]?.message ?? "Invalid payload");
  }

  try {
    const totals = totalsFromWriteInput(parsed.data);
    const invoice = await prisma.invoice.create({
      data: {
        status: "draft",
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
    return NextResponse.json({ invoice: serializeInvoice(invoice) }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save invoice";
    return jsonError(400, "domain_error", message);
  }
}
