/** Integer minor-unit (cent) helpers. Never use floats for persisted money. */

export function roundHalfUpToInt(numerator: number, denominator: number): number {
  if (denominator <= 0) {
    throw new Error("denominator must be positive");
  }
  if (numerator < 0) {
    throw new Error("numerator must be non-negative for invoice money");
  }
  return Math.floor((numerator + Math.floor(denominator / 2)) / denominator);
}

export function parseMoneyToCents(input: string): number | null {
  const trimmed = input.trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    return null;
  }
  const [whole, fraction = ""] = trimmed.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

export function centsToInput(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const whole = Math.floor(abs / 100);
  const frac = String(abs % 100).padStart(2, "0");
  return `${sign}${whole}.${frac}`;
}

export function formatCents(cents: number, currency: string, locale = "en-ET"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export function divRoundHalfUp(numerator: bigint, denominator: bigint): bigint {
  if (denominator <= BigInt(0)) {
    throw new Error("denominator must be positive");
  }
  if (numerator < BigInt(0)) {
    throw new Error("numerator must be non-negative for invoice money");
  }
  return (numerator + denominator / BigInt(2)) / denominator;
}

export function lineTotalMinor(quantityMilli: number, unitPriceMinor: bigint): bigint {
  return divRoundHalfUp(BigInt(quantityMilli) * unitPriceMinor, BigInt(1000));
}

export function taxMinor(subtotalMinor: bigint, taxRateBps: number): bigint {
  return divRoundHalfUp(subtotalMinor * BigInt(taxRateBps), BigInt(10_000));
}

export function parseMajorToMinor(input: string, currency = "ETB"): bigint {
  void currency;
  const cents = parseMoneyToCents(input);
  if (cents == null) {
    throw new Error("invalid money amount");
  }
  return BigInt(cents);
}

export function formatMinor(minor: bigint, currency = "ETB"): string {
  void currency;
  return centsToInput(Number(minor));
}

export function quantityToMilli(input: string): number {
  const trimmed = input.trim().replace(",", ".");
  if (!/^\d+(\.\d{1,3})?$/.test(trimmed)) {
    throw new Error("invalid quantity");
  }
  const [whole, fraction = ""] = trimmed.split(".");
  return Number(whole) * 1000 + Number(fraction.padEnd(3, "0"));
}
