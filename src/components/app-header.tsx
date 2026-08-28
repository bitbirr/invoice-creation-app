"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const onLogin = pathname === "/login";

  async function logout() {
    await fetch("/api/auth/login", { method: "DELETE" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link href={onLogin ? "/login" : "/"} className="text-base font-semibold text-slate-900">
          Invoices
        </Link>
        {onLogin ? null : (
          <div className="flex items-center gap-2">
            <Link
              href="/invoices/new"
              className="rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white"
            >
              New
            </Link>
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800"
              onClick={logout}
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
