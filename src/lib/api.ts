import type { InvoiceDTO, InvoiceSummary } from "@/server/invoices";

export type ApiError = {
  code: string;
  message: string;
  fields?: Record<string, string>;
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const json = (await response.json()) as { data?: T; error?: ApiError };
  if (!response.ok || json.error) {
    throw json.error ?? { code: "HTTP_ERROR", message: "Request failed." };
  }
  return json.data as T;
}

export function listInvoicesRequest() {
  return request<{ invoices: InvoiceSummary[] }>("/api/invoices");
}

export function getInvoiceRequest(id: string) {
  return request<InvoiceDTO>(`/api/invoices/${id}`);
}

export function createInvoiceRequest(body: unknown) {
  return request<InvoiceDTO>("/api/invoices", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateInvoiceRequest(id: string, body: unknown) {
  return request<InvoiceDTO>(`/api/invoices/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function submitInvoiceRequest(id: string, version: number) {
  return request<InvoiceDTO>(`/api/invoices/${id}/submit`, {
    method: "POST",
    body: JSON.stringify({ version }),
  });
}
