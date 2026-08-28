import { InvoiceForm } from "@/components/invoice-form";

export default function NewInvoicePage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">New invoice</h1>
      <InvoiceForm />
    </section>
  );
}
