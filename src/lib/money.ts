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

export function formatCents(cents: number, currency: string, locale = "en-IE"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(cents / 100);
}
