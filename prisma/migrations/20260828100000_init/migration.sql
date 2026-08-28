-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "invoice";

-- CreateEnum
CREATE TYPE "invoice"."InvoiceStatus" AS ENUM ('draft', 'submitted', 'voided');

-- CreateTable
CREATE TABLE "invoice"."issuer_profiles" (
    "id" TEXT NOT NULL,
    "legal_name" TEXT NOT NULL,
    "address_line1" TEXT,
    "address_line2" TEXT,
    "city" TEXT,
    "region" TEXT,
    "postal_code" TEXT,
    "country" TEXT NOT NULL DEFAULT 'ET',
    "email" TEXT,
    "phone" TEXT,
    "tax_id" TEXT,
    "currency" CHAR(3) NOT NULL DEFAULT 'ETB',
    "default_tax_bps" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "issuer_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice"."invoices" (
    "id" TEXT NOT NULL,
    "status" "invoice"."InvoiceStatus" NOT NULL DEFAULT 'draft',
    "invoice_number" TEXT,
    "issue_date" DATE NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "tax_rate_bps" INTEGER NOT NULL,
    "customer_name" TEXT NOT NULL,
    "customer_email" TEXT,
    "billing_address" TEXT,
    "notes" TEXT,
    "subtotal_minor" BIGINT NOT NULL,
    "tax_minor" BIGINT NOT NULL,
    "total_minor" BIGINT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "submitted_at" TIMESTAMP(3),
    "snapshot" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice"."line_items" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "quantity_milli" INTEGER NOT NULL,
    "unit_price_minor" BIGINT NOT NULL,
    "line_total_minor" BIGINT NOT NULL,

    CONSTRAINT "line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice"."invoice_number_sequences" (
    "year" INTEGER NOT NULL,
    "last_value" INTEGER NOT NULL,

    CONSTRAINT "invoice_number_sequences_pkey" PRIMARY KEY ("year")
);

CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoice"."invoices"("invoice_number");
CREATE INDEX "invoices_status_created_at_idx" ON "invoice"."invoices"("status", "created_at");
CREATE INDEX "line_items_invoice_id_position_idx" ON "invoice"."line_items"("invoice_id", "position");

ALTER TABLE "invoice"."line_items"
  ADD CONSTRAINT "line_items_invoice_id_fkey"
  FOREIGN KEY ("invoice_id") REFERENCES "invoice"."invoices"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "invoice"."invoices"
  ADD CONSTRAINT "invoices_subtotal_nonneg" CHECK ("subtotal_minor" >= 0);
ALTER TABLE "invoice"."invoices"
  ADD CONSTRAINT "invoices_tax_nonneg" CHECK ("tax_minor" >= 0);
ALTER TABLE "invoice"."invoices"
  ADD CONSTRAINT "invoices_total_nonneg" CHECK ("total_minor" >= 0);
ALTER TABLE "invoice"."invoices"
  ADD CONSTRAINT "invoices_tax_bps_range" CHECK ("tax_rate_bps" >= 0 AND "tax_rate_bps" <= 10000);
ALTER TABLE "invoice"."line_items"
  ADD CONSTRAINT "line_items_qty_positive" CHECK ("quantity_milli" > 0);
ALTER TABLE "invoice"."line_items"
  ADD CONSTRAINT "line_items_price_nonneg" CHECK ("unit_price_minor" >= 0);
ALTER TABLE "invoice"."line_items"
  ADD CONSTRAINT "line_items_total_nonneg" CHECK ("line_total_minor" >= 0);
