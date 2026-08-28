export type CurrencyCode = "ETB" | "USD" | "EUR" | "GBP";

const ZERO = BigInt(0);
const TWO = BigInt(2);
const TEN = BigInt(10);
const THOUSAND = BigInt(1000);
const TEN_THOUSAND = BigInt(10_000);

const MINOR_DIGITS: Record<string, number> = {
  ETB: 2,
  USD: 2,
  EUR: 2,
  GBP: 2,
};

export function minorDigitsFor(currency: string): number {
  return MINOR_DIGITS[currency] ?? 2;
}

/** Half-up division of a BigInt by a positive divisor. */
export function divRoundHalfUp(numerator: bigint, divisor: bigint): bigint {
  if (divisor <= ZERO) {
    throw new Error("divisor must be positive");
  }
  const half = divisor / TWO;
  if (numerator >= ZERO) {
    return (numerator + half) / divisor;
  }
  return (numerator - half) / divisor;
}

/**
 * Line total in minor units.
 * quantityMilli: 1000 = 1.000 of the billed unit.
 */
export function lineTotalMinor(quantityMilli: number, unitPriceMinor: bigint): bigint {
  if (!Number.isInteger(quantityMilli) || quantityMilli <= 0) {
    throw new Error("quantityMilli must be a positive integer");
  }
  if (unitPriceMinor < ZERO) {
    throw new Error("unitPriceMinor must be >= 0");
  }
  return divRoundHalfUp(BigInt(quantityMilli) * unitPriceMinor, THOUSAND);
}

/** taxRateBps: 1500 = 15.00%. */
export function taxMinor(subtotalMinor: bigint, taxRateBps: number): bigint {
  if (!Number.isInteger(taxRateBps) || taxRateBps < 0 || taxRateBps > 10_000) {
    throw new Error("taxRateBps must be an integer between 0 and 10000");
  }
  if (subtotalMinor < ZERO) {
    throw new Error("subtotalMinor must be >= 0");
  }
  return divRoundHalfUp(subtotalMinor * BigInt(taxRateBps), TEN_THOUSAND);
}

export function parseMajorToMinor(major: string, currency: string): bigint {
  const digits = minorDigitsFor(currency);
  const trimmed = major.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error("amount must be a non-negative decimal");
  }
  const [whole, frac = ""] = trimmed.split(".");
  if (frac.length > digits) {
    throw new Error(`amount allows at most ${digits} decimal places`);
  }
  const padded = (frac + "0".repeat(digits)).slice(0, digits);
  return BigInt(whole) * TEN ** BigInt(digits) + BigInt(padded || "0");
}

export function formatMinor(minor: bigint, currency: string): string {
  const digits = minorDigitsFor(currency);
  const negative = minor < ZERO;
  const abs = negative ? -minor : minor;
  const scale = TEN ** BigInt(digits);
  const whole = abs / scale;
  const frac = (abs % scale).toString().padStart(digits, "0");
  const sign = negative ? "-" : "";
  return digits === 0 ? `${sign}${whole}` : `${sign}${whole}.${frac}`;
}

export function quantityToMilli(quantity: string): number {
  const trimmed = quantity.trim();
  if (!/^\d+(\.\d{1,3})?$/.test(trimmed)) {
    throw new Error("quantity must be a positive decimal with up to 3 places");
  }
  const [whole, frac = ""] = trimmed.split(".");
  const milli = Number(whole) * 1000 + Number((frac + "000").slice(0, 3));
  if (!Number.isInteger(milli) || milli <= 0) {
    throw new Error("quantity must be greater than zero");
  }
  return milli;
}

export function milliToQuantity(quantityMilli: number): string {
  const whole = Math.trunc(quantityMilli / 1000);
  const frac = (quantityMilli % 1000).toString().padStart(3, "0").replace(/0+$/, "");
  return frac.length === 0 ? String(whole) : `${whole}.${frac}`;
}
