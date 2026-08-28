import { InvoiceList } from "@/components/invoice-list";
import { listInvoices, type InvoiceSummary } from "@/server/invoices";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let invoices: InvoiceSummary[] = [];
  let dbError = false;
  try {
    invoices = await listInvoices();
  } catch {
    dbError = true;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
        <p className="mt-1 text-sm text-slate-600">
          Create drafts, submit, and export a PDF. Totals are calculated on the server.
        </p>
      </div>
      {dbError ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Database is not reachable. Start Postgres with <code>docker compose up -d</code>, copy{" "}
          <code>.env.example</code> to <code>.env</code>, then run <code>npx prisma migrate deploy</code>.
        </p>
      ) : null}
      <InvoiceList invoices={invoices} />
    </div>
  );
}
