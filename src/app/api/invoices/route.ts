import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";
import { fromUnknown, jsonError } from "@/lib/http";
import { createInvoiceService } from "@/lib/invoice-service";
import { invoiceWriteSchema } from "@/lib/validation";

function requireDb() {
  const prisma = getPrisma();
  if (!prisma) {
    return {
      error: jsonError(
        503,
        "database_unavailable",
        "DATABASE_URL is not set. Start Postgres (docker compose up -d) and copy .env.example to .env.",
      ),
    };
  }
  return { service: createInvoiceService(prisma) };
}

export async function GET() {
  const db = requireDb();
  if ("error" in db && db.error) return db.error;
  try {
    return NextResponse.json({ invoices: await db.service!.list() });
  } catch (error) {
    return fromUnknown(error);
  }
}

export async function POST(request: Request) {
  const db = requireDb();
  if ("error" in db && db.error) return db.error;
  try {
    const body = await request.json();
    const input = invoiceWriteSchema.parse(body);
    const invoice = await db.service!.createDraft(input);
    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error) {
    return fromUnknown(error);
  }
}
