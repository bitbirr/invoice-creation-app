import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatMinor, milliToQuantity } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { lineItems: { orderBy: { position: "asc" } } },
  });
  if (!invoice) {
    notFound();
  }

  return (
    <article className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{invoice.invoiceNumber ?? "Draft invoice"}</h1>
          <p className="text-sm text-stone-600">
            {invoice.status} · {invoice.customerName}
          </p>
        </div>
        <a
          className="rounded-full bg-teal-700 px-3 py-1.5 text-sm text-white"
          href={`/api/invoices/${invoice.id}/pdf`}
        >
          Download PDF
        </a>
      </div>
      <ul className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
        {invoice.lineItems.map((line) => (
          <li key={line.id} className="flex justify-between gap-3 px-4 py-3 text-sm">
            <span>
              {line.description}
              <span className="block text-xs text-stone-500">
                {milliToQuantity(line.quantityMilli)} × {formatMinor(line.unitPriceMinor, invoice.currency)}
              </span>
            </span>
            <span>
              {invoice.currency} {formatMinor(line.lineTotalMinor, invoice.currency)}
            </span>
          </li>
        ))}
      </ul>
      <div className="text-right text-sm">
        <p>Subtotal {formatMinor(invoice.subtotalMinor, invoice.currency)}</p>
        <p>Tax {formatMinor(invoice.taxMinor, invoice.currency)}</p>
        <p className="font-semibold">Total {formatMinor(invoice.totalMinor, invoice.currency)}</p>
      </div>
    </article>
  );
}
