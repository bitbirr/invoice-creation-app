import { describe, expect, it } from "vitest";
import { calculateInvoice } from "./invoice-calc";
import { centsToInput, parseMoneyToCents, roundHalfUpToInt } from "./money";
import { formatInvoiceNumber } from "./numbering";
import { fieldErrors, invoiceSubmitSchema, invoiceWriteSchema } from "./validation";

describe("roundHalfUpToInt", () => {
  it("rounds .5 up for positive money", () => {
    expect(roundHalfUpToInt(15, 10)).toBe(2);
    expect(roundHalfUpToInt(14, 10)).toBe(1);
    expect(roundHalfUpToInt(0, 10)).toBe(0);
  });

  it("computes Ethiopian 15% VAT on 100.00 as 15.00", () => {
    expect(roundHalfUpToInt(10000 * 1500, 10_000)).toBe(1500);
  });

  it("rounds 0.005 EUR half up to 0.01", () => {
    // 1 cent * 50% = 0.5 cent → 1
    expect(roundHalfUpToInt(1 * 5000, 10_000)).toBe(1);
  });
});

describe("parseMoneyToCents", () => {
  it("parses dotted and comma decimals", () => {
    expect(parseMoneyToCents("12.5")).toBe(1250);
    expect(parseMoneyToCents("12,50")).toBe(1250);
    expect(parseMoneyToCents("0.09")).toBe(9);
    expect(parseMoneyToCents("abc")).toBeNull();
    expect(parseMoneyToCents("12.345")).toBeNull();
  });

  it("round-trips through centsToInput", () => {
    expect(centsToInput(1250)).toBe("12.50");
    expect(parseMoneyToCents(centsToInput(9))).toBe(9);
  });
});

describe("calculateInvoice", () => {
  it("multiplies quantity and unit price without float error", () => {
    const result = calculateInvoice(
      [
        { description: "Hours", quantity: 3, unitPriceCents: 1999 },
        { description: "Parts", quantity: 2, unitPriceCents: 50 },
      ],
      1500,
    );
    expect(result.lineItems[0]?.lineTotalCents).toBe(5997);
    expect(result.subtotalCents).toBe(6097);
    expect(result.taxCents).toBe(915); // 6097 * 0.15 = 914.55 → 915
    expect(result.totalCents).toBe(7012);
  });

  it("allows zero-price lines and zero tax", () => {
    const result = calculateInvoice(
      [{ description: "Complimentary", quantity: 1, unitPriceCents: 0 }],
      0,
    );
    expect(result.totalCents).toBe(0);
  });

  it("rejects fractional quantity", () => {
    expect(() =>
      calculateInvoice([{ description: "x", quantity: 1.5, unitPriceCents: 100 }], 0),
    ).toThrow(/quantity/);
  });
});

describe("invoice numbering", () => {
  it("pads to six digits", () => {
    expect(formatInvoiceNumber(2026, 1)).toBe("INV-2026-000001");
    expect(formatInvoiceNumber(2026, 42)).toBe("INV-2026-000042");
  });
});

describe("validation", () => {
  it("allows empty customer name on draft", () => {
    const parsed = invoiceWriteSchema.safeParse({
      customerName: "",
      lineItems: [],
    });
    expect(parsed.success).toBe(true);
  });

  it("requires customer name and a line to submit", () => {
    const parsed = invoiceSubmitSchema.safeParse({
      customerName: "  ",
      lineItems: [],
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const fields = fieldErrors(parsed.error);
      expect(fields.customerName).toBeTruthy();
      expect(fields.lineItems).toBeTruthy();
    }
  });
});
