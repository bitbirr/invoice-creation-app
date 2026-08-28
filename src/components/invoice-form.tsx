"use client";

import { useMemo, useState } from "react";
import { calculateInvoice } from "@/lib/invoice-calc";

type Line = { description: string; quantity: string; unitPrice: string };

const emptyLine = (): Line => ({ description: "", quantity: "1", unitPrice: "0.00" });

export function InvoiceForm() {
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [taxRateBps, setTaxRateBps] = useState(1500);
  const [lines, setLines] = useState<Line[]>([emptyLine()]);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const totals = useMemo(() => {
    try {
      const valid = lines.filter((line) => line.description.trim().length > 0);
      if (valid.length === 0) {
        return { subtotal: "0.00", taxTotal: "0.00", grandTotal: "0.00" };
      }
      return calculateInvoice({ taxRateBps, lineItems: valid });
    } catch {
      return { subtotal: "—", taxTotal: "—", grandTotal: "—" };
    }
  }, [lines, taxRateBps]);

  function updateLine(index: number, patch: Partial<Line>) {
    setLines((current) => current.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  async function submit(as: "draft" | "submitted") {
    setBusy(true);
    setStatus(null);
    try {
      const payload = {
        customerName,
        customerEmail,
        billingAddress,
        taxRateBps,
        currency: "ETB",
        lineItems: lines.filter((line) => line.description.trim().length > 0),
      };
      const createResponse = await fetch("/api/invoices", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const created = await createResponse.json();
      if (!createResponse.ok) {
        setStatus(created.error?.message ?? "Could not save invoice");
        return;
      }
      if (as === "draft") {
        setStatus(`Draft saved (${created.invoice.id})`);
        return;
      }
      const submitResponse = await fetch(`/api/invoices/${created.invoice.id}/submit`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ version: created.invoice.version }),
      });
      const submitted = await submitResponse.json();
      if (!submitResponse.ok) {
        setStatus(submitted.error?.message ?? "Saved as draft, but submit failed");
        return;
      }
      setStatus(`Submitted as ${submitted.invoice.invoiceNumber}`);
    } catch {
      setStatus("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className="space-y-6 pb-28"
      onSubmit={(event) => {
        event.preventDefault();
        void submit("draft");
      }}
    >
      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Customer</h2>
        <label className="block text-sm">
          Name
          <input
            required
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Email
          <input
            type="email"
            value={customerEmail}
            onChange={(event) => setCustomerEmail(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Billing address
          <textarea
            value={billingAddress}
            onChange={(event) => setBillingAddress(event.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Line items
          </h2>
          <button
            type="button"
            onClick={() => setLines((current) => [...current, emptyLine()])}
            className="text-sm font-medium text-blue-700"
          >
            Add line
          </button>
        </div>
        {lines.map((line, index) => (
          <div key={index} className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
            <input
              placeholder="Description"
              value={line.description}
              onChange={(event) => updateLine(index, { description: event.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <label className="text-sm">
                Qty
                <input
                  inputMode="decimal"
                  value={line.quantity}
                  onChange={(event) => updateLine(index, { quantity: event.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="text-sm">
                Unit price
                <input
                  inputMode="decimal"
                  value={line.unitPrice}
                  onChange={(event) => updateLine(index, { unitPrice: event.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
            </div>
            {lines.length > 1 ? (
              <button
                type="button"
                onClick={() => setLines((current) => current.filter((_, i) => i !== index))}
                className="text-sm text-red-700"
              >
                Remove
              </button>
            ) : null}
          </div>
        ))}
      </section>

      <label className="block text-sm">
        Tax rate (basis points, 1500 = 15%)
        <input
          type="number"
          min={0}
          max={10000}
          value={taxRateBps}
          onChange={(event) => setTaxRateBps(Number(event.target.value))}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </label>

      {status ? <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm">{status}</p> : null}

      <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 p-4 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div className="text-sm">
            <div className="text-slate-500">Grand total</div>
            <div className="text-lg font-semibold">ETB {totals.grandTotal}</div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium"
            >
              Save draft
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void submit("submitted")}
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
