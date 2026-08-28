import Decimal from "decimal.js";

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export const MONEY_SCALE = 2;
export const QUANTITY_SCALE = 4;

export class MoneyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MoneyError";
  }
}

export function toDecimal(value: string | number | Decimal): Decimal {
  try {
    const parsed = new Decimal(value);
    if (!parsed.isFinite()) {
      throw new MoneyError(`Not a finite decimal: ${value}`);
    }
    return parsed;
  } catch (error) {
    if (error instanceof MoneyError) throw error;
    throw new MoneyError(`Invalid decimal: ${value}`);
  }
}

export function roundMoney(value: Decimal): Decimal {
  return value.toDecimalPlaces(MONEY_SCALE, Decimal.ROUND_HALF_UP);
}

export function moneyString(value: Decimal): string {
  return roundMoney(value).toFixed(MONEY_SCALE);
}
