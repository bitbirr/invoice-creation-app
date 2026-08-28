import type { Invoice, LineItem, Prisma } from "@prisma/client";
import { getCompany } from "@/lib/company";
import { DomainError } from "@/lib/http";
import { calculateInvoice } from "@/lib/invoice-calc";
import { prisma } from "@/lib/prisma";
import { formatInvoiceNumber } from "@/lib/numbering";
import {
  fieldErrors,
  invoicePatchSchema,
  invoiceSubmitSchema,
  invoiceWriteSchema,
  type InvoiceWrite,
} from "@/lib/validation";

export type InvoiceDTO = {
  id: string;
  status: "DRAFT" | "SUBMITTED";
  number: string | null;
  currency: string;
  taxRateBps: number;
  customerName: string;
  customerEmail: string | null;
  customerAddress: string | null;
  notes: string | null;
  sellerName: string;
  sellerAddress: string;
  sellerEmail: string;
  sellerVat: string;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  version: number;
  issueDate: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  lineItems: {
    id: string;
    position: number;
    description: string;
    quantity: number;
    unitPriceCents: number;
    lineTotalCents: number;
  }[];
};

export type InvoiceSummary = {
  id: string;
  status: "DRAFT" | "SUBMITTED";
  number: string | null;
  customerName: string;
  totalCents: number;
  currency: string;
  updatedAt: string;
};

type InvoiceWithLines = Invoice & { lineItems: LineItem[] };

function toDTO(invoice: InvoiceWithLines): InvoiceDTO {
  return {
    id: invoice.id,
    status: invoice.status,
    number: invoice.number,
    currency: invoice.currency,
    taxRateBps: invoice.taxRateBps,
    customerName: invoice.customerName,
    customerEmail: invoice.customerEmail,
    customerAddress: invoice.customerAddress,
    notes: invoice.notes,
    sellerName: invoice.sellerName,
    sellerAddress: invoice.sellerAddress,
    sellerEmail: invoice.sellerEmail,
    sellerVat: invoice.sellerVat,
    subtotalCents: invoice.subtotalCents,
    taxCents: invoice.taxCents,
    totalCents: invoice.totalCents,
    version: invoice.version,
    issueDate: invoice.issueDate?.toISOString() ?? null,
    submittedAt: invoice.submittedAt?.toISOString() ?? null,
    createdAt: invoice.createdAt.toISOString(),
    updatedAt: invoice.updatedAt.toISOString(),
    lineItems: [...invoice.lineItems]
      .sort((a, b) => a.position - b.position)
      .map((line) => ({
        id: line.id,
        position: line.position,
        description: line.description,
        quantity: line.quantity,
        unitPriceCents: line.unitPriceCents,
        lineTotalCents: line.lineTotalCents,
      })),
  };
}

function parseWrite(input: unknown, mode: "draft" | "submit"): InvoiceWrite {
  const parsed = invoiceWriteSchema.safeParse(input);
  if (!parsed.success) {
    throw new DomainError(
      "VALIDATION_FAILED",
      "Fix the highlighted fields.",
      400,
      fieldErrors(parsed.error),
    );
  }
  if (mode === "submit") {
    const submitParsed = invoiceSubmitSchema.safeParse(parsed.data);
    if (!submitParsed.success) {
      throw new DomainError(
        "VALIDATION_FAILED",
        "Fix the highlighted fields.",
      400,
        fieldErrors(submitParsed.error),
      );
    }
  }
  return parsed.data;
}

function persistable(data: InvoiceWrite) {
  const company = getCompany();
  const totals = calculateInvoice(data.lineItems, company.taxRateBps);
  return { company, totals };
}

function lineCreates(
  totals: ReturnType<typeof calculateInvoice>,
): Prisma.LineItemCreateWithoutInvoiceInput[] {
  return totals.lineItems.map((line) => ({
    position: line.position,
    description: line.description,
    quantity: line.quantity,
    unitPriceCents: line.unitPriceCents,
    lineTotalCents: line.lineTotalCents,
  }));
}

export async function listInvoices(status?: "DRAFT" | "SUBMITTED"): Promise<InvoiceSummary[]> {
  const invoices = await prisma.invoice.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return invoices.map((invoice) => ({
    id: invoice.id,
    status: invoice.status,
    number: invoice.number,
    customerName: invoice.customerName || "Untitled draft",
    totalCents: invoice.totalCents,
    currency: invoice.currency,
    updatedAt: invoice.updatedAt.toISOString(),
  }));
}

export async function getInvoice(id: string): Promise<InvoiceDTO> {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { lineItems: true },
  });
  if (!invoice) {
    throw new DomainError("NOT_FOUND", "Invoice not found.", 404);
  }
  return toDTO(invoice);
}

export async function createDraft(input: unknown): Promise<InvoiceDTO> {
  const data = parseWrite(input, "draft");
  const { company, totals } = persistable(data);
  const invoice = await prisma.invoice.create({
    data: {
      status: "DRAFT",
      currency: company.currency,
      taxRateBps: company.taxRateBps,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerAddress: data.customerAddress,
      notes: data.notes,
      sellerName: company.name,
      sellerAddress: company.address,
      sellerEmail: company.email,
      sellerVat: company.vatNumber,
      subtotalCents: totals.subtotalCents,
      taxCents: totals.taxCents,
      totalCents: totals.totalCents,
      lineItems: { create: lineCreates(totals) },
    },
    include: { lineItems: true },
  });
  return toDTO(invoice);
}

export async function updateDraft(id: string, input: unknown): Promise<InvoiceDTO> {
  const parsed = invoicePatchSchema.safeParse(input);
  if (!parsed.success) {
    throw new DomainError(
      "VALIDATION_FAILED",
      "Fix the highlighted fields.",
      400,
      fieldErrors(parsed.error),
    );
  }
  const data = parseWrite(parsed.data, "draft");
  const { company, totals } = persistable(data);

  try {
    const invoice = await prisma.$transaction(async (tx) => {
      const existing = await tx.invoice.findUnique({ where: { id } });
      if (!existing) {
        throw new DomainError("NOT_FOUND", "Invoice not found.", 404);
      }
      if (existing.status !== "DRAFT") {
        throw new DomainError(
          "INVOICE_IMMUTABLE",
          "Submitted invoices cannot be edited.",
          409,
        );
      }
      if (existing.version !== parsed.data.version) {
        throw new DomainError(
          "VERSION_CONFLICT",
          "This invoice was changed in another session. Reload and try again.",
          409,
        );
      }

      await tx.lineItem.deleteMany({ where: { invoiceId: id } });
      return tx.invoice.update({
        where: { id },
        data: {
          currency: company.currency,
          taxRateBps: company.taxRateBps,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerAddress: data.customerAddress,
          notes: data.notes,
          sellerName: company.name,
          sellerAddress: company.address,
          sellerEmail: company.email,
          sellerVat: company.vatNumber,
          subtotalCents: totals.subtotalCents,
          taxCents: totals.taxCents,
          totalCents: totals.totalCents,
          version: { increment: 1 },
          lineItems: { create: lineCreates(totals) },
        },
        include: { lineItems: true },
      });
    });
    return toDTO(invoice);
  } catch (error) {
    if (error instanceof DomainError) throw error;
    throw error;
  }
}

async function nextInvoiceNumber(
  tx: Prisma.TransactionClient,
  year: number,
): Promise<string> {
  await tx.$executeRaw`
    INSERT INTO "InvoiceSequence" ("year", "last")
    VALUES (${year}, 0)
    ON CONFLICT ("year") DO NOTHING
  `;
  const rows = await tx.$queryRaw<Array<{ last: number }>>`
    UPDATE "InvoiceSequence"
    SET "last" = "last" + 1
    WHERE "year" = ${year}
    RETURNING "last"
  `;
  const last = rows[0]?.last;
  if (last == null) {
    throw new DomainError("INTERNAL_ERROR", "Could not allocate an invoice number.", 500);
  }
  return formatInvoiceNumber(year, last);
}

export async function submitInvoice(id: string, version: number): Promise<InvoiceDTO> {
  const existing = await prisma.invoice.findUnique({
    where: { id },
    include: { lineItems: true },
  });
  if (!existing) {
    throw new DomainError("NOT_FOUND", "Invoice not found.", 404);
  }
  if (existing.status === "SUBMITTED") {
    return toDTO(existing);
  }
  if (existing.version !== version) {
    throw new DomainError(
      "VERSION_CONFLICT",
      "This invoice was changed in another session. Reload and try again.",
      409,
    );
  }

  const write: InvoiceWrite = {
    customerName: existing.customerName,
    customerEmail: existing.customerEmail,
    customerAddress: existing.customerAddress,
    notes: existing.notes,
    lineItems: [...existing.lineItems]
      .sort((a, b) => a.position - b.position)
      .map((line) => ({
        description: line.description,
        quantity: line.quantity,
        unitPriceCents: line.unitPriceCents,
      })),
  };
  parseWrite(write, "submit");
  const { company, totals } = persistable(write);
  const now = new Date();
  const year = now.getUTCFullYear();

  const invoice = await prisma.$transaction(async (tx) => {
    const current = await tx.invoice.findUnique({ where: { id } });
    if (!current) {
      throw new DomainError("NOT_FOUND", "Invoice not found.", 404);
    }
    if (current.status === "SUBMITTED") {
      return tx.invoice.findUniqueOrThrow({
        where: { id },
        include: { lineItems: true },
      });
    }
    if (current.version !== version) {
      throw new DomainError(
        "VERSION_CONFLICT",
        "This invoice was changed in another session. Reload and try again.",
        409,
      );
    }

    const number = await nextInvoiceNumber(tx, year);
    await tx.lineItem.deleteMany({ where: { invoiceId: id } });
    return tx.invoice.update({
      where: { id },
      data: {
        status: "SUBMITTED",
        number,
        issueDate: now,
        submittedAt: now,
        currency: company.currency,
        taxRateBps: company.taxRateBps,
        sellerName: company.name,
        sellerAddress: company.address,
        sellerEmail: company.email,
        sellerVat: company.vatNumber,
        subtotalCents: totals.subtotalCents,
        taxCents: totals.taxCents,
        totalCents: totals.totalCents,
        version: { increment: 1 },
        lineItems: { create: lineCreates(totals) },
      },
      include: { lineItems: true },
    });
  });

  return toDTO(invoice);
}
