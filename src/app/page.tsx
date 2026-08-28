import { prisma } from "@/lib/db";
import { formatMinor } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let invoices: Awaited<ReturnType<typeof prisma.invoice.findMany>> = [];
  let dbError: string | null = null;
  try {
    invoices = await prisma.invoice.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  } catch {
    dbError =
      "Database is not reachable yet. Start Postgres with docker compose, copy .env.example to .env, then run prisma migrate deploy.";
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Invoices</h1>
        <p className="mt-1 text-sm text-stone-600">
          Draft internally, submit to freeze totals, then export a PDF from persisted amounts.
        </p>
      </div>
      {dbError ? (
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm">{dbError}</p>
      ) : null}
      {invoices.length === 0 && !dbError ? (
        <p className="text-sm text-stone-600">No invoices yet.</p>
      ) : (
        <ul className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
          {invoices.map((invoice) => (
            <li key={invoice.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="font-medium">{invoice.customerName}</p>
                <p className="text-xs text-stone-500">
                  {invoice.invoiceNumber ?? "Draft"} · {invoice.status}
                </p>
              </div>
              <div className="text-right text-sm">
                <p>
                  {invoice.currency} {formatMinor(invoice.totalMinor, invoice.currency)}
                </p>
                <a className="text-teal-800 underline" href={`/invoices/${invoice.id}`}>
                  Open
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
