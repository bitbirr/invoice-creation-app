-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('draft', 'submitted');

-- CreateTable
CREATE TABLE "issuer_profiles" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "legal_name" TEXT NOT NULL,
    "address" TEXT NOT NULL DEFAULT '',
    "email" TEXT,
    "phone" TEXT,
    "tax_id" TEXT,
    "default_currency" CHAR(3) NOT NULL DEFAULT 'ETB',
    "default_tax_rate_bps" INTEGER NOT NULL DEFAULT 1500,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "issuer_profiles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "issuer_profiles_singleton" CHECK ("id" = 'default'),
    CONSTRAINT "issuer_tax_rate_bps_range" CHECK ("default_tax_rate_bps" >= 0 AND "default_tax_rate_bps" <= 10000)
);

-- CreateTable
CREATE TABLE "invoice_number_sequences" (
    "year" INTEGER NOT NULL,
    "last_value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "invoice_number_sequences_pkey" PRIMARY KEY ("year")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'draft',
    "number" TEXT,
    "issue_date" DATE,
    "due_date" DATE,
    "currency" CHAR(3) NOT NULL,
    "tax_rate_bps" INTEGER NOT NULL,
    "customer_name" TEXT NOT NULL DEFAULT '',
    "customer_email" TEXT,
    "customer_phone" TEXT,
    "billing_address" TEXT NOT NULL DEFAULT '',
    "notes" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "subtotal_minor" BIGINT NOT NULL DEFAULT 0,
    "tax_minor" BIGINT NOT NULL DEFAULT 0,
    "total_minor" BIGINT NOT NULL DEFAULT 0,
    "submitted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "invoices_tax_rate_bps_range" CHECK ("tax_rate_bps" >= 0 AND "tax_rate_bps" <= 10000),
    CONSTRAINT "invoices_submitted_snapshot" CHECK (
      ("status" = 'draft' AND "number" IS NULL AND "submitted_at" IS NULL)
      OR
      ("status" = 'submitted' AND "number" IS NOT NULL AND "submitted_at" IS NOT NULL)
    )
);

-- CreateTable
CREATE TABLE "invoice_line_items" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unit_price_minor" BIGINT NOT NULL,
    "line_total_minor" BIGINT NOT NULL,

    CONSTRAINT "invoice_line_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "invoice_line_items_qty_positive" CHECK ("quantity" > 0),
    CONSTRAINT "invoice_line_items_unit_price_nonneg" CHECK ("unit_price_minor" >= 0),
    CONSTRAINT "invoice_line_items_position_nonneg" CHECK ("position" >= 0)
);

-- CreateIndex
CREATE UNIQUE INDEX "invoices_number_key" ON "invoices"("number");

-- CreateIndex
CREATE INDEX "invoices_status_created_at_idx" ON "invoices"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "invoice_line_items_invoice_id_idx" ON "invoice_line_items"("invoice_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_line_items_invoice_id_position_key" ON "invoice_line_items"("invoice_id", "position");

-- AddForeignKey
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
