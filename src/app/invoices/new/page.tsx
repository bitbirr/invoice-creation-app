import { InvoiceForm } from "@/components/invoice-form";

export default function NewInvoicePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">New invoice</h1>
      <InvoiceForm />
    </div>
  );
}
