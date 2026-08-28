"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createInvoiceRequest,
  submitInvoiceRequest,
  updateInvoiceRequest,
  type ApiError,
} from "@/lib/api";
import { calculateInvoice } from "@/lib/invoice-calc";
import { centsToInput, formatCents, parseMoneyToCents } from "@/lib/money";
import type { InvoiceDTO } from "@/server/invoices";

type DraftLine = {
  key: string;
  description: string;
  quantity: string;
  unitPrice: string;
};

function newLine(): DraftLine {
  return {
    key: crypto.randomUUID(),
    description: "",
    quantity: "1",
    unitPrice: "0.00",
  };
}

function linesFromInvoice(invoice: InvoiceDTO | null): DraftLine[] {
  if (!invoice || invoice.lineItems.length === 0) {
    return [newLine()];
  }
  return invoice.lineItems.map((line) => ({
    key: line.id,
    description: line.description,
    quantity: String(line.quantity),
    unitPrice: centsToInput(line.unitPriceCents),
  }));
}

type Props = {
  invoice: InvoiceDTO | null;
  defaultCurrency: string;
  defaultTaxRateBps: number;
};

export function InvoiceForm({ invoice, defaultCurrency, defaultTaxRateBps }: Props) {
  const router = useRouter();
  const [savedInvoice, setSavedInvoice] = useState(invoice);
  const submitted = savedInvoice?.status === "SUBMITTED";
  const [customerName, setCustomerName] = useState(invoice?.customerName ?? "");
  const [customerEmail, setCustomerEmail] = useState(invoice?.customerEmail ?? "");
  const [customerAddress, setCustomerAddress] = useState(invoice?.customerAddress ?? "");
  const [notes, setNotes] = useState(invoice?.notes ?? "");
  const [lines, setLines] = useState<DraftLine[]>(() => linesFromInvoice(invoice));
  const [fields, setFields] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [pending, setPending] = useState<"save" | "submit" | null>(null);

  const currency = savedInvoice?.currency ?? defaultCurrency;
  const taxRateBps = savedInvoice?.taxRateBps ?? defaultTaxRateBps;

  const preview = useMemo(() => {
    const parsed = lines.map((line) => ({
      description: line.description,
      quantity: Number.parseInt(line.quantity, 10),
      unitPriceCents: parseMoneyToCents(line.unitPrice) ?? 0,
    }));
    const usable = parsed.filter(
      (line) =>
        Number.isInteger(line.quantity) &&
        line.quantity >= 1 &&
        Number.isInteger(line.unitPriceCents) &&
        line.unitPriceCents >= 0,
    );
    try {
      return calculateInvoice(usable, taxRateBps);
    } catch {
      return null;
    }
  }, [lines, taxRateBps]);

  function buildBody() {
    const fieldMap: Record<string, string> = {};
    const lineItems = lines.map((line, index) => {
      const quantity = Number.parseInt(line.quantity, 10);
      const unitPriceCents = parseMoneyToCents(line.unitPrice);
      if (!Number.isInteger(quantity) || quantity < 1) {
        fieldMap[`lineItems.${index}.quantity`] = "Quantity must be a whole number of at least 1.";
      }
      if (unitPriceCents == null) {
        fieldMap[`lineItems.${index}.unitPriceCents`] = "Enter a price like 12.50.";
      }
      return {
        description: line.description,
        quantity: Number.isInteger(quantity) ? quantity : 0,
        unitPriceCents: unitPriceCents ?? -1,
      };
    });
    if (Object.keys(fieldMap).length > 0) {
      setFields(fieldMap);
      throw new Error("client-validation");
    }
    return {
      customerName,
      customerEmail: customerEmail.trim() === "" ? null : customerEmail,
      customerAddress: customerAddress.trim() === "" ? null : customerAddress,
      notes: notes.trim() === "" ? null : notes,
      lineItems,
    };
  }

  function showError(error: ApiError) {
    setFields(error.fields ?? {});
    setBanner(error.message);
  }

  async function persistDraft() {
    const body = buildBody();
    if (savedInvoice) {
      return updateInvoiceRequest(savedInvoice.id, { ...body, version: savedInvoice.version });
    }
    return createInvoiceRequest(body);
  }

  async function onSave() {
    setPending("save");
    setBanner(null);
    setFields({});
    try {
      const saved = await persistDraft();
      setSavedInvoice(saved);
      if (!invoice) {
        router.replace(`/invoices/${saved.id}`);
        router.refresh();
        return;
      }
      router.refresh();
    } catch (error) {
      if ((error as Error).message !== "client-validation") {
        showError(error as ApiError);
      }
    } finally {
      setPending(null);
    }
  }

  async function onSubmit() {
    setPending("submit");
    setBanner(null);
    setFields({});
    try {
      const saved = await persistDraft();
      const submittedInvoice = await submitInvoiceRequest(saved.id, saved.version);
      setSavedInvoice(submittedInvoice);
      router.replace(`/invoices/${submittedInvoice.id}`);
      router.refresh();
    } catch (error) {
      if ((error as Error).message !== "client-validation") {
        showError(error as ApiError);
      }
    } finally {
      setPending(null);
    }
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 disabled:bg-slate-100";

  return (
    <form
      className="space-y-6 pb-36"
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      {banner ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {banner}
        </p>
      ) : null}

      {submitted ? (
        <p className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-900">
          Submitted as <strong>{savedInvoice?.number}</strong>. Totals are locked. You can still download the PDF.
        </p>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Customer</h2>
        <label className="mt-3 block text-sm font-medium text-slate-700">
          Name
          <input
            className={inputClass}
            value={customerName}
            disabled={submitted}
            autoComplete="organization"
            onChange={(event) => setCustomerName(event.target.value)}
          />
          {fields.customerName ? <span className="text-sm text-red-700">{fields.customerName}</span> : null}
        </label>
        <label className="mt-3 block text-sm font-medium text-slate-700">
          Email
          <input
            className={inputClass}
            type="email"
            value={customerEmail}
            disabled={submitted}
            autoComplete="email"
            onChange={(event) => setCustomerEmail(event.target.value)}
          />
          {fields.customerEmail ? <span className="text-sm text-red-700">{fields.customerEmail}</span> : null}
        </label>
        <label className="mt-3 block text-sm font-medium text-slate-700">
          Billing address
          <textarea
            className={`${inputClass} min-h-24`}
            value={customerAddress}
            disabled={submitted}
            onChange={(event) => setCustomerAddress(event.target.value)}
          />
        </label>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Line items</h2>
          {fields.lineItems ? <span className="text-sm text-red-700">{fields.lineItems}</span> : null}
        </div>
        <ul className="mt-3 space-y-4">
          {lines.map((line, index) => (
            <li key={line.key} className="rounded-lg border border-slate-200 p-3">
              <label className="block text-sm font-medium text-slate-700">
                Description
                <input
                  className={inputClass}
                  value={line.description}
                  disabled={submitted}
                  onChange={(event) => {
                    const next = [...lines];
                    next[index] = { ...line, description: event.target.value };
                    setLines(next);
                  }}
                />
                {fields[`lineItems.${index}.description`] ? (
                  <span className="text-sm text-red-700">{fields[`lineItems.${index}.description`]}</span>
                ) : null}
              </label>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <label className="block text-sm font-medium text-slate-700">
                  Qty
                  <input
                    className={inputClass}
                    inputMode="numeric"
                    value={line.quantity}
                    disabled={submitted}
                    onChange={(event) => {
                      const next = [...lines];
                      next[index] = { ...line, quantity: event.target.value };
                      setLines(next);
                    }}
                  />
                  {fields[`lineItems.${index}.quantity`] ? (
                    <span className="text-sm text-red-700">{fields[`lineItems.${index}.quantity`]}</span>
                  ) : null}
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Unit price
                  <input
                    className={inputClass}
                    inputMode="decimal"
                    value={line.unitPrice}
                    disabled={submitted}
                    onChange={(event) => {
                      const next = [...lines];
                      next[index] = { ...line, unitPrice: event.target.value };
                      setLines(next);
                    }}
                  />
                  {fields[`lineItems.${index}.unitPriceCents`] ? (
                    <span className="text-sm text-red-700">{fields[`lineItems.${index}.unitPriceCents`]}</span>
                  ) : null}
                </label>
              </div>
              {!submitted ? (
                <button
                  type="button"
                  className="mt-3 text-sm font-medium text-red-700"
                  onClick={() => setLines(lines.filter((_, lineIndex) => lineIndex !== index))}
                  disabled={lines.length === 1}
                >
                  Remove item
                </button>
              ) : null}
            </li>
          ))}
        </ul>
        {!submitted ? (
          <button
            type="button"
            className="mt-4 w-full rounded-lg border border-dashed border-slate-400 py-3 text-sm font-medium text-slate-700"
            onClick={() => setLines([...lines, newLine()])}
          >
            Add line item
          </button>
        ) : null}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="block text-sm font-medium text-slate-700">
          Notes
          <textarea
            className={`${inputClass} min-h-20`}
            value={notes}
            disabled={submitted}
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>
      </section>

      <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 p-4 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <dl className="mx-auto flex max-w-3xl flex-col gap-1 text-sm text-slate-700">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{preview ? formatCents(preview.subtotalCents, currency) : "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Tax ({(taxRateBps / 100).toFixed(2)}%)</dt>
            <dd>{preview ? formatCents(preview.taxCents, currency) : "—"}</dd>
          </div>
          <div className="flex justify-between text-base font-semibold text-slate-900">
            <dt>Total</dt>
            <dd>{preview ? formatCents(preview.totalCents, currency) : "—"}</dd>
          </div>
        </dl>
        <div className="mx-auto mt-3 flex max-w-3xl gap-3">
          {savedInvoice ? (
            <a
              className="flex-1 rounded-lg border border-slate-300 py-3 text-center text-sm font-semibold text-slate-800"
              href={`/api/invoices/${savedInvoice.id}/pdf`}
            >
              Download PDF
            </a>
          ) : null}
          {!submitted ? (
            <>
              <button
                type="button"
                className="flex-1 rounded-lg border border-slate-300 py-3 text-sm font-semibold text-slate-800 disabled:opacity-50"
                onClick={onSave}
                disabled={pending !== null}
              >
                {pending === "save" ? "Saving…" : "Save draft"}
              </button>
              <button
                type="button"
                className="flex-1 rounded-lg bg-teal-700 py-3 text-sm font-semibold text-white disabled:opacity-50"
                onClick={onSubmit}
                disabled={pending !== null}
              >
                {pending === "submit" ? "Submitting…" : "Submit"}
              </button>
            </>
          ) : null}
        </div>
      </div>
    </form>
  );
}
