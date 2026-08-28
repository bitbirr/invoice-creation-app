import { InvoiceForm } from "@/components/invoice-form";
import { getCompany } from "@/lib/company";

export default function NewInvoicePage() {
  const company = getCompany();
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold tracking-tight">New invoice</h1>
      <InvoiceForm
        invoice={null}
        defaultCurrency={company.currency}
        defaultTaxRateBps={company.taxRateBps}
      />
    </div>
  );
}
