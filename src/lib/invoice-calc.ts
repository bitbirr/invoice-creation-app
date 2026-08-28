import Decimal from "decimal.js";
import { MoneyError, moneyString, roundMoney, toDecimal } from "./money";

export type LineInput = {
  description: string;
  quantity: string;
  unitPrice: string;
};

export type CalculatedLine = LineInput & {
  position: number;
  lineTotal: string;
};

export type InvoiceCalcInput = {
  lineItems: LineInput[];
  taxRateBps: number;
};

export type InvoiceTotals = {
  lines: CalculatedLine[];
  subtotal: string;
  taxTotal: string;
  grandTotal: string;
  taxRateBps: number;
};

/**
 * Authoritative invoice arithmetic.
 *
 * Policy (proposed; confirm before go-live):
 * 1. Line total = round_half_up(quantity * unitPrice, 2)
 * 2. Subtotal   = sum of rounded line totals
 * 3. Tax        = round_half_up(subtotal * taxRateBps / 10000, 2)
 * 4. Grand total = subtotal + tax
 *
 * Browser UI may call this for instant feedback. Save and submit always
 * recompute on the server with this same function and persist the snapshots.
 */
export function calculateInvoice(input: InvoiceCalcInput): InvoiceTotals {
  if (!Number.isInteger(input.taxRateBps) || input.taxRateBps < 0 || input.taxRateBps > 10000) {
    throw new MoneyError("taxRateBps must be an integer between 0 and 10000");
  }

  const lines: CalculatedLine[] = input.lineItems.map((item, index) => {
    const quantity = toDecimal(item.quantity);
    const unitPrice = toDecimal(item.unitPrice);
    if (quantity.lt(0) || unitPrice.lt(0)) {
      throw new MoneyError("Quantity and unit price must be >= 0");
    }
    if (quantity.decimalPlaces() > 4) {
      throw new MoneyError("Quantity supports at most 4 decimal places");
    }
    const lineTotal = roundMoney(quantity.times(unitPrice));
    return {
      description: item.description,
      quantity: quantity.toFixed(),
      unitPrice: moneyString(unitPrice),
      position: index,
      lineTotal: moneyString(lineTotal),
    };
  });

  const subtotal = roundMoney(
    lines.reduce((acc, line) => acc.plus(line.lineTotal), new Decimal(0)),
  );
  const taxRate = toDecimal(input.taxRateBps).dividedBy(10000);
  const taxTotal = roundMoney(subtotal.times(taxRate));
  const grandTotal = roundMoney(subtotal.plus(taxTotal));

  return {
    lines,
    subtotal: moneyString(subtotal),
    taxTotal: moneyString(taxTotal),
    grandTotal: moneyString(grandTotal),
    taxRateBps: input.taxRateBps,
  };
}
