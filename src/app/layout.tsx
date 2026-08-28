import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Invoice Creation",
  description: "Internal customer invoice drafts, submission, and PDF export",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">
        <header className="border-b border-stone-200 bg-white">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
            <a href="/" className="text-sm font-semibold tracking-tight">
              Invoice Creation
            </a>
            <a
              href="/invoices/new"
              className="rounded-full bg-teal-700 px-3 py-1.5 text-sm text-white"
            >
              New invoice
            </a>
          </div>
        </header>
        <main className="mx-auto w-full max-w-3xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
