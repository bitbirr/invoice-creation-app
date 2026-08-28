import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .max(2000)
  .nullable()
  .optional()
  .transform((value) => {
    if (value == null) return null;
    return value.length === 0 ? null : value;
  });

export const lineItemWriteSchema = z.object({
  description: z.string().trim().min(1, "Description is required.").max(500),
  quantity: z.number().int("Quantity must be a whole number.").min(1, "Quantity must be at least 1."),
  unitPriceCents: z
    .number()
    .int("Unit price must be in cents.")
    .min(0, "Unit price cannot be negative."),
});

export const invoiceWriteSchema = z.object({
  customerName: z.string().trim().max(200),
  customerEmail: z
    .union([z.string().trim().email("Enter a valid email.").max(200), z.literal(""), z.null()])
    .optional()
    .transform((value) => {
      if (value == null || value === "") return null;
      return value;
    }),
  customerAddress: optionalText,
  notes: optionalText,
  lineItems: z.array(lineItemWriteSchema).max(100),
});

export const invoicePatchSchema = invoiceWriteSchema.extend({
  version: z.number().int().min(1),
});

export const submitSchema = z.object({
  version: z.number().int().min(1),
});

export const invoiceSubmitSchema = invoiceWriteSchema.superRefine((value, ctx) => {
  if (value.customerName.length === 0) {
    ctx.addIssue({
      code: "custom",
      path: ["customerName"],
      message: "Customer name is required to submit.",
    });
  }
  if (value.lineItems.length < 1) {
    ctx.addIssue({
      code: "custom",
      path: ["lineItems"],
      message: "Add at least one line item to submit.",
    });
  }
});

export type InvoiceWrite = z.infer<typeof invoiceWriteSchema>;
export type InvoicePatch = z.infer<typeof invoicePatchSchema>;

export const invoicePreviewSchema = z.object({
  currency: z.string().length(3),
  taxRateBps: z.number().int().min(0).max(10000),
  lineItems: z.array(lineItemWriteSchema).min(1),
});

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".");
    const key = path.length > 0 ? path : "form";
    if (!fields[key]) {
      fields[key] = issue.message;
    }
  }
  return fields;
}
