import Link from "next/link";
import { formatCents } from "@/lib/money";
import type { InvoiceSummary } from "@/server/invoices";

export function InvoiceList({ invoices }: { invoices: InvoiceSummary[] }) {
  if (invoices.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <p className="text-slate-700">No invoices yet.</p>
        <Link
          href="/invoices/new"
          className="mt-4 inline-block rounded-lg bg-teal-700 px-4 py-3 text-sm font-semibold text-white"
        >
          Create invoice
        </Link>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
      {invoices.map((invoice) => (
        <li key={invoice.id}>
          <Link href={`/invoices/${invoice.id}`} className="block px-4 py-4 hover:bg-slate-50">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-slate-900">{invoice.customerName}</p>
                <p className="text-sm text-slate-500">{invoice.number ?? "Draft"}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-900">
                  {formatCents(invoice.totalCents, invoice.currency)}
                </p>
                <p className="text-xs uppercase tracking-wide text-slate-500">{invoice.status}</p>
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
