import { jsonError } from "@/lib/http";

export async function POST() {
  return jsonError(
    409,
    "INVOICE_IMMUTABLE",
    "Voiding is not in MVP. Submitted invoices stay locked.",
  );
}
