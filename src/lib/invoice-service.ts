import type { Invoice, InvoiceLineItem, PrismaClient } from "@prisma/client";
import { calculateInvoice } from "./invoice-calc";
import { InvoiceConflictError } from "./http";
import type { InvoiceWriteInput } from "./validation";

const DEFAULT_ISSUER_NAME = "BitBirr";

export type InvoiceWithLines = Invoice & { lineItems: InvoiceLineItem[] };

function serialize(invoice: InvoiceWithLines) {
  return {
    id: invoice.id,
    status: invoice.status,
    invoiceNumber: invoice.invoiceNumber,
    issueDate: invoice.issueDate?.toISOString().slice(0, 10) ?? null,
    dueDate: invoice.dueDate?.toISOString().slice(0, 10) ?? null,
    currency: invoice.currency,
    taxRateBps: invoice.taxRateBps,
    customerName: invoice.customerName,
    customerEmail: invoice.customerEmail,
    billingAddress: invoice.billingAddress,
    notes: invoice.notes,
    subtotal: invoice.subtotal.toFixed(2),
    taxTotal: invoice.taxTotal.toFixed(2),
    grandTotal: invoice.grandTotal.toFixed(2),
    version: invoice.version,
    submittedAt: invoice.submittedAt?.toISOString() ?? null,
    voidedAt: invoice.voidedAt?.toISOString() ?? null,
    voidReason: invoice.voidReason,
    createdAt: invoice.createdAt.toISOString(),
    updatedAt: invoice.updatedAt.toISOString(),
    lineItems: invoice.lineItems
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((line) => ({
        id: line.id,
        position: line.position,
        description: line.description,
        quantity: line.quantity.toString(),
        unitPrice: line.unitPrice.toFixed(2),
        lineTotal: line.lineTotal.toFixed(2),
      })),
  };
}

function totalsFromInput(input: InvoiceWriteInput) {
  return calculateInvoice({
    taxRateBps: input.taxRateBps,
    lineItems: input.lineItems,
  });
}

async function ensureSettings(prisma: PrismaClient) {
  const existing = await prisma.organizationSettings.findFirst();
  if (existing) return existing;
  return prisma.organizationSettings.create({
    data: {
      legalName: DEFAULT_ISSUER_NAME,
      invoiceYear: new Date().getUTCFullYear(),
    },
  });
}

export function createInvoiceService(prisma: PrismaClient) {
  return {
    serialize,

    async list() {
      const invoices = await prisma.invoice.findMany({
        include: { lineItems: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      return invoices.map(serialize);
    },

    async get(id: string) {
      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: { lineItems: true },
      });
      if (!invoice) return null;
      return serialize(invoice);
    },

    async createDraft(input: InvoiceWriteInput) {
      const totals = totalsFromInput(input);
      const invoice = await prisma.invoice.create({
        data: {
          status: "DRAFT",
          currency: input.currency,
          taxRateBps: totals.taxRateBps,
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          billingAddress: input.billingAddress,
          notes: input.notes,
          issueDate: input.issueDate ? new Date(input.issueDate) : null,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          subtotal: totals.subtotal,
          taxTotal: totals.taxTotal,
          grandTotal: totals.grandTotal,
          lineItems: {
            create: totals.lines.map((line) => ({
              position: line.position,
              description: line.description,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              lineTotal: line.lineTotal,
            })),
          },
        },
        include: { lineItems: true },
      });
      return serialize(invoice);
    },

    async updateDraft(id: string, input: InvoiceWriteInput) {
      const existing = await prisma.invoice.findUnique({ where: { id } });
      if (!existing) return null;
      if (existing.status !== "DRAFT") {
        throw new InvoiceConflictError(
          "immutable_invoice",
          "Only draft invoices can be edited. Void and create a correction instead.",
        );
      }
      if (input.version !== undefined && input.version !== existing.version) {
        throw new InvoiceConflictError(
          "version_conflict",
          "Invoice was updated by someone else. Reload and retry.",
        );
      }

      const totals = totalsFromInput(input);
      const invoice = await prisma.$transaction(async (tx) => {
        await tx.invoiceLineItem.deleteMany({ where: { invoiceId: id } });
        return tx.invoice.update({
          where: { id },
          data: {
            currency: input.currency,
            taxRateBps: totals.taxRateBps,
            customerName: input.customerName,
            customerEmail: input.customerEmail,
            billingAddress: input.billingAddress,
            notes: input.notes,
            issueDate: input.issueDate ? new Date(input.issueDate) : null,
            dueDate: input.dueDate ? new Date(input.dueDate) : null,
            subtotal: totals.subtotal,
            taxTotal: totals.taxTotal,
            grandTotal: totals.grandTotal,
            version: { increment: 1 },
            lineItems: {
              create: totals.lines.map((line) => ({
                position: line.position,
                description: line.description,
                quantity: line.quantity,
                unitPrice: line.unitPrice,
                lineTotal: line.lineTotal,
              })),
            },
          },
          include: { lineItems: true },
        });
      });
      return serialize(invoice);
    },

    async submit(id: string, expectedVersion?: number) {
      return prisma.$transaction(async (tx) => {
        const existing = await tx.invoice.findUnique({
          where: { id },
          include: { lineItems: true },
        });
        if (!existing) return null;
        if (existing.status === "SUBMITTED") {
          return serialize(existing);
        }
        if (existing.status !== "DRAFT") {
          throw new InvoiceConflictError("invalid_transition", "Only drafts can be submitted.");
        }
        if (expectedVersion !== undefined && expectedVersion !== existing.version) {
          throw new InvoiceConflictError(
            "version_conflict",
            "Invoice was updated by someone else. Reload and retry.",
          );
        }
        if (existing.lineItems.length === 0) {
          throw new InvoiceConflictError("validation_error", "Add at least one line item before submitting.", 400);
        }

        const settings = await tx.organizationSettings.findFirst({
          orderBy: { createdAt: "asc" },
        });
        const issuer =
          settings ??
          (await tx.organizationSettings.create({
            data: {
              legalName: DEFAULT_ISSUER_NAME,
              invoiceYear: new Date().getUTCFullYear(),
            },
          }));

        const year = new Date().getUTCFullYear();
        const nextSeq = issuer.invoiceYear === year ? issuer.invoiceSeq + 1 : 1;
        const invoiceNumber = `${issuer.invoicePrefix}-${year}-${String(nextSeq).padStart(4, "0")}`;

        await tx.organizationSettings.update({
          where: { id: issuer.id },
          data: { invoiceYear: year, invoiceSeq: nextSeq },
        });

        const recomputed = calculateInvoice({
          taxRateBps: existing.taxRateBps,
          lineItems: existing.lineItems
            .sort((a, b) => a.position - b.position)
            .map((line) => ({
              description: line.description,
              quantity: line.quantity.toString(),
              unitPrice: line.unitPrice.toString(),
            })),
        });

        const submitted = await tx.invoice.update({
          where: { id },
          data: {
            status: "SUBMITTED",
            invoiceNumber,
            issueDate: existing.issueDate ?? new Date(),
            submittedAt: new Date(),
            subtotal: recomputed.subtotal,
            taxTotal: recomputed.taxTotal,
            grandTotal: recomputed.grandTotal,
            version: { increment: 1 },
          },
          include: { lineItems: true },
        });
        return serialize(submitted);
      });
    },

    async voidInvoice(id: string, reason: string) {
      const existing = await prisma.invoice.findUnique({
        where: { id },
        include: { lineItems: true },
      });
      if (!existing) return null;
      if (existing.status === "VOID") return serialize(existing);
      if (existing.status !== "SUBMITTED") {
        throw new InvoiceConflictError("invalid_transition", "Only submitted invoices can be voided.");
      }
      const voided = await prisma.invoice.update({
        where: { id },
        data: {
          status: "VOID",
          voidedAt: new Date(),
          voidReason: reason,
          version: { increment: 1 },
        },
        include: { lineItems: true },
      });
      return serialize(voided);
    },

    ensureSettings,
  };
}
