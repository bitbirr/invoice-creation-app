import { roundHalfUpToInt } from "./money";

export type LineInput = {
  description: string;
  quantity: number;
  unitPriceCents: number;
};

export type CalculatedLine = LineInput & {
  position: number;
  lineTotalCents: number;
};

export type InvoiceTotals = {
  lineItems: CalculatedLine[];
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
};

export function calculateInvoice(
  lines: LineInput[],
  taxRateBps: number,
): InvoiceTotals {
  if (!Number.isInteger(taxRateBps) || taxRateBps < 0 || taxRateBps > 10000) {
    throw new Error("taxRateBps must be an integer from 0 to 10000");
  }

  const lineItems: CalculatedLine[] = lines.map((line, position) => {
    if (!Number.isInteger(line.quantity) || line.quantity < 1) {
      throw new Error(`quantity must be an integer ≥ 1 (line ${position + 1})`);
    }
    if (!Number.isInteger(line.unitPriceCents) || line.unitPriceCents < 0) {
      throw new Error(`unitPriceCents must be an integer ≥ 0 (line ${position + 1})`);
    }
    return {
      ...line,
      position,
      lineTotalCents: line.quantity * line.unitPriceCents,
    };
  });

  const subtotalCents = lineItems.reduce((sum, line) => sum + line.lineTotalCents, 0);
  const taxCents = roundHalfUpToInt(subtotalCents * taxRateBps, 10_000);
  const totalCents = subtotalCents + taxCents;

  return { lineItems, subtotalCents, taxCents, totalCents };
}
