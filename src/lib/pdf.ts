import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { formatCents } from "./money";

export type PdfInvoice = {
  status: "DRAFT" | "SUBMITTED";
  number: string | null;
  currency: string;
  taxRateBps: number;
  customerName: string;
  customerEmail: string | null;
  customerAddress: string | null;
  notes: string | null;
  sellerName: string;
  sellerAddress: string;
  sellerEmail: string;
  sellerVat: string;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  issueDate: string | null;
  lineItems: {
    description: string;
    quantity: number;
    unitPriceCents: number;
    lineTotalCents: number;
  }[];
};

function wrap(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current.length === 0 ? word : `${current} ${word}`;
    if (next.length > maxChars) {
      if (current.length > 0) lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current.length > 0) lines.push(current);
  return lines.length > 0 ? lines : [""];
}

export async function renderInvoicePdf(invoice: PdfInvoice): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([595.28, 841.89]);
  const margin = 48;
  let y = 800;
  const ink = rgb(0.1, 0.12, 0.16);
  const muted = rgb(0.4, 0.42, 0.46);

  const draw = (text: string, x: number, size = 10, useBold = false) => {
    page.drawText(text, {
      x,
      y,
      size,
      font: useBold ? bold : font,
      color: ink,
    });
  };

  const ensureSpace = (needed: number) => {
    if (y - needed < 48) {
      page = pdf.addPage([595.28, 841.89]);
      y = 800;
    }
  };

  draw(invoice.sellerName || "Invoice", margin, 18, true);
  y -= 22;
  if (invoice.status === "DRAFT") {
    page.drawText("DRAFT — not an official invoice", {
      x: margin,
      y,
      size: 11,
      font: bold,
      color: rgb(0.7, 0.25, 0.1),
    });
    y -= 18;
  }

  const meta = invoice.number ?? "Unnumbered draft";
  draw(meta, margin, 12, true);
  y -= 16;
  if (invoice.issueDate) {
    draw(`Issue date: ${invoice.issueDate.slice(0, 10)}`, margin, 10);
    y -= 14;
  }

  y -= 8;
  for (const line of [invoice.sellerAddress, invoice.sellerEmail, invoice.sellerVat].filter(Boolean)) {
    draw(line, margin, 9);
    y -= 12;
  }

  y -= 12;
  draw("Bill to", margin, 10, true);
  y -= 14;
  draw(invoice.customerName || "—", margin, 11);
  y -= 14;
  if (invoice.customerAddress) {
    for (const line of wrap(invoice.customerAddress, 70)) {
      draw(line, margin, 9);
      y -= 12;
    }
  }
  if (invoice.customerEmail) {
    draw(invoice.customerEmail, margin, 9);
    y -= 12;
  }

  y -= 16;
  const cols = { desc: margin, qty: 360, price: 420, total: 500 };
  draw("Description", cols.desc, 9, true);
  draw("Qty", cols.qty, 9, true);
  draw("Price", cols.price, 9, true);
  draw("Amount", cols.total, 9, true);
  y -= 8;
  page.drawLine({
    start: { x: margin, y },
    end: { x: 595.28 - margin, y },
    thickness: 0.5,
    color: muted,
  });
  y -= 16;

  for (const line of invoice.lineItems) {
    const descLines = wrap(line.description, 42);
    ensureSpace(14 * descLines.length + 8);
    descLines.forEach((part, index) => {
      draw(part, cols.desc, 9);
      if (index === 0) {
        draw(String(line.quantity), cols.qty, 9);
        draw(formatCents(line.unitPriceCents, invoice.currency), cols.price, 9);
        draw(formatCents(line.lineTotalCents, invoice.currency), cols.total, 9);
      }
      y -= 13;
    });
    y -= 4;
  }

  ensureSpace(80);
  y -= 8;
  page.drawLine({
    start: { x: 340, y },
    end: { x: 595.28 - margin, y },
    thickness: 0.5,
    color: muted,
  });
  y -= 18;
  draw("Subtotal", 340, 10);
  draw(formatCents(invoice.subtotalCents, invoice.currency), cols.total, 10);
  y -= 16;
  draw(`Tax (${(invoice.taxRateBps / 100).toFixed(2)}%)`, 340, 10);
  draw(formatCents(invoice.taxCents, invoice.currency), cols.total, 10);
  y -= 16;
  draw("Total", 340, 12, true);
  draw(formatCents(invoice.totalCents, invoice.currency), cols.total, 12, true);

  if (invoice.notes) {
    y -= 28;
    ensureSpace(40);
    draw("Notes", margin, 10, true);
    y -= 14;
    for (const line of wrap(invoice.notes, 80)) {
      ensureSpace(14);
      draw(line, margin, 9);
      y -= 12;
    }
  }

  return pdf.save();
}
