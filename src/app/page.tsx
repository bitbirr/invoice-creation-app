import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
        <p className="mt-1 text-sm text-slate-600">
          Internal customer invoices. Drafts stay editable; submitted invoices are snapshotted and
          immutable.
        </p>
      </div>
      <Link
        href="/invoices/new"
        className="block rounded-xl bg-blue-600 px-4 py-3 text-center text-base font-medium text-white"
      >
        Create invoice
      </Link>
      <section className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        <p className="font-medium text-slate-900">Local setup</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>
            Copy <code>.env.example</code> to <code>.env</code>
          </li>
          <li>
            Run <code>docker compose up -d</code>
          </li>
          <li>
            Run <code>npx prisma migrate deploy</code>
          </li>
        </ol>
        <p className="mt-3">
          Totals can be previewed without a database via{" "}
          <code>POST /api/invoices/preview</code>. Persistence needs Postgres.
        </p>
      </section>
    </div>
  );
}
