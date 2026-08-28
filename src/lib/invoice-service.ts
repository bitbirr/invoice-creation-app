import { computeInvoiceTotals } from "./invoice-totals";
import { parseMajorToMinor, quantityToMilli } from "./money";
import type { InvoiceWriteInput } from "./http";

export function totalsFromWriteInput(input: InvoiceWriteInput) {
  const lines = input.lines.map((line) => ({
    description: line.description,
    quantityMilli: quantityToMilli(line.quantity),
    unitPriceMinor: parseMajorToMinor(line.unitPrice, input.currency),
  }));
  return computeInvoiceTotals(lines, input.taxRateBps);
}

export function serializeInvoice<
  T extends {
    subtotalMinor: bigint;
    taxMinor: bigint;
    totalMinor: bigint;
    lineItems?: Array<{ unitPriceMinor: bigint; lineTotalMinor: bigint }>;
  },
>(invoice: T) {
  return {
    ...invoice,
    subtotalMinor: invoice.subtotalMinor.toString(),
    taxMinor: invoice.taxMinor.toString(),
    totalMinor: invoice.totalMinor.toString(),
    lineItems: invoice.lineItems?.map((line) => ({
      ...line,
      unitPriceMinor: line.unitPriceMinor.toString(),
      lineTotalMinor: line.lineTotalMinor.toString(),
    })),
  };
}
