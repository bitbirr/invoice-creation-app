export const INVOICE_STATUSES = ["draft", "submitted", "voided"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export class InvoiceLifecycleError extends Error {
  constructor(
    message: string,
    readonly code: "invalid_transition" | "stale_version" | "not_mutable",
  ) {
    super(message);
    this.name = "InvoiceLifecycleError";
  }
}

export function assertDraftMutable(status: InvoiceStatus): void {
  if (status !== "draft") {
    throw new InvoiceLifecycleError(
      "Only draft invoices can be edited",
      "not_mutable",
    );
  }
}

export function assertCanSubmit(status: InvoiceStatus): void {
  if (status !== "draft") {
    throw new InvoiceLifecycleError(
      "Only draft invoices can be submitted",
      "invalid_transition",
    );
  }
}

export function assertVersion(expected: number, actual: number): void {
  if (expected !== actual) {
    throw new InvoiceLifecycleError(
      "Invoice was updated by another request; reload and retry",
      "stale_version",
    );
  }
}

export function formatInvoiceNumber(year: number, sequence: number): string {
  return `INV-${year}-${String(sequence).padStart(4, "0")}`;
}
