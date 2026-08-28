import Link from "next/link";

export function AppHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-base font-semibold text-slate-900">
          Invoices
        </Link>
        <Link
          href="/invoices/new"
          className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white"
        >
          New
        </Link>
      </div>
    </header>
  );
}
