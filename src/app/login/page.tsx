import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-1 mb-6 text-sm text-slate-600">Internal invoice app. Login is required.</p>
      <Suspense fallback={<p className="text-sm text-slate-600">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
