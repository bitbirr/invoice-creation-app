import { notFound } from "next/navigation";
import { InvoiceForm } from "@/components/invoice-form";
import { getCompany } from "@/lib/company";
import { DomainError } from "@/lib/http";
import { getInvoice } from "@/server/invoices";

export const dynamic = "force-dynamic";

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = getCompany();
  let invoice;
  try {
    invoice = await getInvoice(id);
  } catch (error) {
    if (error instanceof DomainError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold tracking-tight">
        {invoice.number ?? "Draft invoice"}
      </h1>
      <InvoiceForm
        invoice={invoice}
        defaultCurrency={company.currency}
        defaultTaxRateBps={company.taxRateBps}
      />
    </div>
  );
}
