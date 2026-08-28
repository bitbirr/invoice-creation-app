import { describe, expect, it } from "vitest";
import { calculateInvoice } from "./invoice-calc";
import { MoneyError } from "./money";

describe("calculateInvoice", () => {
  it("computes line totals, 15% tax, and grand total", () => {
    const result = calculateInvoice({
      taxRateBps: 1500,
      lineItems: [
        { description: "Consulting", quantity: "2", unitPrice: "100.00" },
        { description: "Travel", quantity: "1", unitPrice: "50.00" },
      ],
    });

    expect(result.lines[0].lineTotal).toBe("200.00");
    expect(result.lines[1].lineTotal).toBe("50.00");
    expect(result.subtotal).toBe("250.00");
    expect(result.taxTotal).toBe("37.50");
    expect(result.grandTotal).toBe("287.50");
  });

  it("rounds each line half-up to 2 decimals before summing", () => {
    const result = calculateInvoice({
      taxRateBps: 0,
      lineItems: [
        { description: "A", quantity: "1", unitPrice: "1.005" },
        { description: "B", quantity: "1", unitPrice: "1.005" },
      ],
    });

    expect(result.lines[0].lineTotal).toBe("1.01");
    expect(result.lines[1].lineTotal).toBe("1.01");
    expect(result.subtotal).toBe("2.02");
  });

  it("rounds tax half-up from the rounded subtotal", () => {
    const result = calculateInvoice({
      taxRateBps: 1500,
      lineItems: [{ description: "Item", quantity: "1", unitPrice: "10.01" }],
    });

    expect(result.subtotal).toBe("10.01");
    expect(result.taxTotal).toBe("1.50");
    expect(result.grandTotal).toBe("11.51");
  });

  it("allows zero tax and fractional quantities", () => {
    const result = calculateInvoice({
      taxRateBps: 0,
      lineItems: [{ description: "Hours", quantity: "1.5", unitPrice: "80.00" }],
    });

    expect(result.lines[0].lineTotal).toBe("120.00");
    expect(result.grandTotal).toBe("120.00");
  });

  it("rejects negative amounts", () => {
    expect(() =>
      calculateInvoice({
        taxRateBps: 0,
        lineItems: [{ description: "Bad", quantity: "-1", unitPrice: "10" }],
      }),
    ).toThrow(MoneyError);
  });

  it("rejects an out-of-range tax rate", () => {
    expect(() =>
      calculateInvoice({
        taxRateBps: 10001,
        lineItems: [{ description: "Item", quantity: "1", unitPrice: "1" }],
      }),
    ).toThrow(MoneyError);
  });
});
