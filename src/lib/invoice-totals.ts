import { lineTotalMinor, taxMinor } from "./money";

export type DraftLineInput = {
  description: string;
  quantityMilli: number;
  unitPriceMinor: bigint;
};

export type InvoiceTotals = {
  lines: Array<DraftLineInput & { position: number; lineTotalMinor: bigint }>;
  subtotalMinor: bigint;
  taxMinor: bigint;
  totalMinor: bigint;
};

export function computeInvoiceTotals(
  lines: DraftLineInput[],
  taxRateBps: number,
): InvoiceTotals {
  if (lines.length === 0) {
    throw new Error("at least one line item is required");
  }

  const computed = lines.map((line, index) => {
    const description = line.description.trim();
    if (description.length === 0) {
      throw new Error(`line ${index + 1}: description is required`);
    }
    return {
      ...line,
      description,
      position: index,
      lineTotalMinor: lineTotalMinor(line.quantityMilli, line.unitPriceMinor),
    };
  });

  const subtotal = computed.reduce((sum, line) => sum + line.lineTotalMinor, BigInt(0));
  const tax = taxMinor(subtotal, taxRateBps);
  return {
    lines: computed,
    subtotalMinor: subtotal,
    taxMinor: tax,
    totalMinor: subtotal + tax,
  };
}
