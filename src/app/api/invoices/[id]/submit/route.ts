import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, requireInternalToken } from "@/lib/http";
import {
  assertCanSubmit,
  assertVersion,
  formatInvoiceNumber,
} from "@/lib/invoice-lifecycle";
import { serializeInvoice } from "@/lib/invoice-service";
import { computeInvoiceTotals } from "@/lib/invoice-totals";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const unauthorized = requireInternalToken(request);
  if (unauthorized) return unauthorized;

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { version?: number };
  const idempotencyKey = request.headers.get("idempotency-key");

  const existing = await prisma.invoice.findUnique({
    where: { id },
    include: { lineItems: { orderBy: { position: "asc" } } },
  });
  if (!existing) {
    return jsonError(404, "not_found", "Invoice not found");
  }

  if (existing.status === "submitted") {
    return NextResponse.json({ invoice: serializeInvoice(existing) });
  }

  try {
    assertCanSubmit(existing.status);
    if (body.version !== undefined) {
      assertVersion(body.version, existing.version);
    }

    const totals = computeInvoiceTotals(
      existing.lineItems.map((line) => ({
        description: line.description,
        quantityMilli: line.quantityMilli,
        unitPriceMinor: line.unitPriceMinor,
      })),
      existing.taxRateBps,
    );

    const year = existing.issueDate.getUTCFullYear();
    const invoice = await prisma.$transaction(async (tx) => {
      const sequence = await tx.invoiceNumberSequence.upsert({
        where: { year },
        create: { year, lastValue: 1 },
        update: { lastValue: { increment: 1 } },
      });
      const invoiceNumber = formatInvoiceNumber(year, sequence.lastValue);
      const snapshot = {
        idempotencyKey,
        invoiceNumber,
        customerName: existing.customerName,
        customerEmail: existing.customerEmail,
        billingAddress: existing.billingAddress,
        currency: existing.currency,
        taxRateBps: existing.taxRateBps,
        issueDate: existing.issueDate.toISOString().slice(0, 10),
        notes: existing.notes,
        lines: totals.lines.map((line) => ({
          position: line.position,
          description: line.description,
          quantityMilli: line.quantityMilli,
          unitPriceMinor: line.unitPriceMinor.toString(),
          lineTotalMinor: line.lineTotalMinor.toString(),
        })),
        subtotalMinor: totals.subtotalMinor.toString(),
        taxMinor: totals.taxMinor.toString(),
        totalMinor: totals.totalMinor.toString(),
        submittedAt: new Date().toISOString(),
      };

      return tx.invoice.update({
        where: { id },
        data: {
          status: "submitted",
          invoiceNumber,
          subtotalMinor: totals.subtotalMinor,
          taxMinor: totals.taxMinor,
          totalMinor: totals.totalMinor,
          submittedAt: new Date(),
          snapshot,
          version: { increment: 1 },
        },
        include: { lineItems: { orderBy: { position: "asc" } } },
      });
    });

    return NextResponse.json({ invoice: serializeInvoice(invoice) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not submit invoice";
    const status = message.includes("reload") ? 409 : 400;
    return jsonError(status, "domain_error", message);
  }
}
