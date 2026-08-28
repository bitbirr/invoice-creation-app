import { describe, expect, it } from "vitest";
import {
  divRoundHalfUp,
  formatMinor,
  lineTotalMinor,
  parseMajorToMinor,
  quantityToMilli,
  taxMinor,
} from "./money";
import { computeInvoiceTotals } from "./invoice-totals";
import {
  assertCanSubmit,
  assertDraftMutable,
  formatInvoiceNumber,
  InvoiceLifecycleError,
} from "./invoice-lifecycle";

describe("money", () => {
  it("computes line totals with milli-quantities", () => {
    expect(lineTotalMinor(1000, BigInt(2500))).toBe(BigInt(2500));
    expect(lineTotalMinor(1500, BigInt(10000))).toBe(BigInt(15000));
  });

  it("rounds line totals half-up at the minor unit", () => {
    expect(lineTotalMinor(1333, BigInt(100))).toBe(BigInt(133));
    expect(lineTotalMinor(1335, BigInt(100))).toBe(BigInt(134));
  });

  it("computes tax from basis points", () => {
    expect(taxMinor(BigInt(10000), 1500)).toBe(BigInt(1500));
    expect(taxMinor(BigInt(333), 1500)).toBe(BigInt(50));
  });

  it("parses and formats major units", () => {
    expect(parseMajorToMinor("12.50", "ETB")).toBe(BigInt(1250));
    expect(formatMinor(BigInt(1250), "ETB")).toBe("12.50");
    expect(quantityToMilli("2.5")).toBe(2500);
  });

  it("divides with half-up", () => {
    expect(divRoundHalfUp(BigInt(5), BigInt(2))).toBe(BigInt(3));
    expect(divRoundHalfUp(BigInt(4), BigInt(2))).toBe(BigInt(2));
  });
});

describe("invoice totals", () => {
  it("sums lines then applies tax", () => {
    const totals = computeInvoiceTotals(
      [
        { description: "Consulting", quantityMilli: 2000, unitPriceMinor: BigInt(150000) },
        { description: "Travel", quantityMilli: 1000, unitPriceMinor: BigInt(2500) },
      ],
      1500,
    );
    expect(totals.subtotalMinor).toBe(BigInt(302500));
    expect(totals.taxMinor).toBe(BigInt(45375));
    expect(totals.totalMinor).toBe(BigInt(347875));
  });

  it("rejects empty invoices", () => {
    expect(() => computeInvoiceTotals([], 0)).toThrow(/at least one line/i);
  });
});

describe("lifecycle", () => {
  it("formats sequential numbers", () => {
    expect(formatInvoiceNumber(2026, 1)).toBe("INV-2026-0001");
  });

  it("blocks edits after submit", () => {
    expect(() => assertDraftMutable("submitted")).toThrow(InvoiceLifecycleError);
    expect(() => assertCanSubmit("submitted")).toThrow(InvoiceLifecycleError);
  });
});
