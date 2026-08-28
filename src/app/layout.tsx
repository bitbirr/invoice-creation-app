import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Invoice Creation",
  description: "Internal invoice drafts, submission, and PDF export",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-base font-semibold text-slate-900">
              Invoice Creation
            </Link>
            <Link
              href="/invoices/new"
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white"
            >
              New invoice
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
