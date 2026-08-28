import { z } from "zod";
import { toDecimal } from "./money";

const decimalString = z
  .string()
  .min(1)
  .refine((value) => {
    try {
      const parsed = toDecimal(value);
      return parsed.gte(0) && parsed.lte("999999999");
    } catch {
      return false;
    }
  }, "Must be a non-negative decimal");

export const lineItemInputSchema = z.object({
  description: z.string().trim().min(1).max(500),
  quantity: decimalString,
  unitPrice: decimalString,
});

export const invoiceWriteSchema = z.object({
  customerName: z.string().trim().min(1).max(200),
  customerEmail: z
    .string()
    .email()
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined)),
  billingAddress: z.string().max(1000).optional(),
  notes: z.string().max(2000).optional(),
  currency: z
    .string()
    .length(3)
    .transform((value) => value.toUpperCase())
    .default("ETB"),
  taxRateBps: z.number().int().min(0).max(10000).default(1500),
  issueDate: z.string().date().optional(),
  dueDate: z.string().date().optional(),
  lineItems: z.array(lineItemInputSchema).min(1).max(100),
  version: z.number().int().positive().optional(),
});

export const invoicePreviewSchema = invoiceWriteSchema.pick({
  lineItems: true,
  taxRateBps: true,
  currency: true,
});

export type InvoiceWriteInput = z.infer<typeof invoiceWriteSchema>;
