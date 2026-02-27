import { z } from "zod";

import { InvoiceSchema } from "@/lib/schemas";
import { ExportTypes } from "@/types";

export const MAX_EMAIL_ATTACHMENT_BYTES = 5 * 1024 * 1024;
export const MAX_PAYMENT_LINK_AMOUNT = 1_000_000_000;

const toOptionalTrimmedString = (value: unknown) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const toDateCompatibleInvoicePayload = (payload: unknown) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return payload;
  }

  const draft = JSON.parse(JSON.stringify(payload)) as Record<string, unknown>;
  const details =
    draft.details && typeof draft.details === "object" && !Array.isArray(draft.details)
      ? (draft.details as Record<string, unknown>)
      : null;

  if (!details) return draft;

  for (const key of ["invoiceDate", "dueDate"] as const) {
    const raw = details[key];
    if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
      continue;
    }

    const parsed = Date.parse(String(raw ?? ""));
    if (Number.isFinite(parsed)) {
      details[key] = new Date(parsed);
    }
  }

  return draft;
};

export const invoiceGenerateRequestSchema = z.preprocess(
  toDateCompatibleInvoicePayload,
  InvoiceSchema
);

export const invoiceExportRequestSchema = z.preprocess(
  toDateCompatibleInvoicePayload,
  InvoiceSchema
);

export const invoiceExportQuerySchema = z.object({
  format: z.nativeEnum(ExportTypes),
});

export const invoiceSendRequestSchema = z.object({
  email: z.string().trim().email(),
  invoiceNumber: z.string().trim().min(1),
  documentType: z.enum(["invoice", "quote"]).optional(),
  paymentLinkUrl: z.string().trim().url().max(2048).optional(),
  subject: z.string().trim().max(160).optional(),
  body: z.string().trim().max(5000).optional(),
  footer: z.string().trim().max(500).optional(),
  attachmentSizeBytes: z
    .number()
    .int()
    .positive()
    .max(MAX_EMAIL_ATTACHMENT_BYTES),
});

export const invoicePaymentLinkRequestSchema = z.object({
  invoiceNumber: z.string().trim().min(1),
  documentType: z.enum(["invoice", "quote"]).optional(),
  currency: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{3}$/, "Currency must be a 3-letter ISO code")
    .transform((value) => value.toLowerCase()),
  amount: z.coerce.number().positive().max(MAX_PAYMENT_LINK_AMOUNT),
  customerEmail: z.preprocess(
    toOptionalTrimmedString,
    z.string().email().optional()
  ),
  successUrl: z.preprocess(
    toOptionalTrimmedString,
    z.string().url().max(2048).optional()
  ),
  cancelUrl: z.preprocess(
    toOptionalTrimmedString,
    z.string().url().max(2048).optional()
  ),
});

export const invoiceApiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

export type InvoiceApiErrorPayload = z.infer<typeof invoiceApiErrorSchema>;

export const toApiErrorMessage = (
  payload: unknown,
  fallback = "Request failed"
): string => {
  const parsed = invoiceApiErrorSchema.safeParse(payload);
  if (!parsed.success) return fallback;
  return parsed.data.error.message || fallback;
};
