export type CompanyProfile = {
  name: string;
  address: string;
  email: string;
  vatNumber: string;
  currency: string;
  taxRateBps: number;
};

function requiredEnv(name: string, fallback: string): string {
  const value = process.env[name];
  if (value == null || value.trim().length === 0) {
    return fallback;
  }
  return value.trim();
}

export function getCompany(): CompanyProfile {
  const taxRateBps = Number(process.env.TAX_RATE_BPS ?? "1500");
  if (!Number.isInteger(taxRateBps) || taxRateBps < 0 || taxRateBps > 10000) {
    throw new Error("TAX_RATE_BPS must be an integer from 0 to 10000");
  }

  const currency = requiredEnv("CURRENCY", "ETB").toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new Error("CURRENCY must be a 3-letter ISO code");
  }

  return {
    name: requiredEnv("COMPANY_NAME", "BitBirr"),
    address: requiredEnv("COMPANY_ADDRESS", ""),
    email: requiredEnv("COMPANY_EMAIL", ""),
    vatNumber: requiredEnv("COMPANY_VAT", ""),
    currency,
    taxRateBps,
  };
}
