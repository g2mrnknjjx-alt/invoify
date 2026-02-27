import {
  normalizeDocumentType,
  toDocumentTypeLabel,
} from "@/lib/invoice/documentType";
import { HttpError } from "@/lib/server/httpError";
import { STRIPE_SECRET_KEY } from "@/lib/variables";

type CreateStripePaymentLinkArgs = {
  invoiceNumber: string;
  documentType?: "invoice" | "quote";
  currency: string;
  amount: number;
  customerEmail?: string;
  successUrl?: string;
  cancelUrl?: string;
  requestOrigin: string;
};

const STRIPE_CHECKOUT_SESSIONS_URL = "https://api.stripe.com/v1/checkout/sessions";
const DEFAULT_SUCCESS_PATH = "/?payment=success";
const DEFAULT_CANCEL_PATH = "/?payment=cancelled";

const ZERO_DECIMAL_CURRENCIES = new Set([
  "bif",
  "clp",
  "djf",
  "gnf",
  "jpy",
  "kmf",
  "krw",
  "mga",
  "pyg",
  "rwf",
  "ugx",
  "vnd",
  "vuv",
  "xaf",
  "xof",
  "xpf",
]);

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const toMinorAmount = (amount: number, currency: string): number => {
  const normalizedCurrency = currency.toLowerCase();
  if (ZERO_DECIMAL_CURRENCIES.has(normalizedCurrency)) {
    return Math.round(amount);
  }
  return Math.round(amount * 100);
};

const toDefaultUrl = (origin: string, path: string) => {
  try {
    return new URL(path, origin).toString();
  } catch {
    throw new HttpError({
      status: 400,
      code: "invalid_origin",
      message: "Unable to resolve payment redirect URLs",
      details: { origin },
    });
  }
};

export const createStripePaymentLinkService = async ({
  invoiceNumber,
  documentType,
  currency,
  amount,
  customerEmail,
  successUrl,
  cancelUrl,
  requestOrigin,
}: CreateStripePaymentLinkArgs): Promise<{ url: string }> => {
  if (!STRIPE_SECRET_KEY) {
    throw new HttpError({
      status: 500,
      code: "stripe_not_configured",
      message: "Stripe is not configured. Set STRIPE_SECRET_KEY.",
    });
  }

  const normalizedDocumentType = normalizeDocumentType(documentType);
  const documentLabel = toDocumentTypeLabel(normalizedDocumentType);
  const normalizedCurrency = currency.toLowerCase();
  const amountMinor = toMinorAmount(amount, normalizedCurrency);

  if (!Number.isFinite(amountMinor) || amountMinor <= 0) {
    throw new HttpError({
      status: 400,
      code: "invalid_amount",
      message: "Amount must be greater than zero",
    });
  }

  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("line_items[0][price_data][currency]", normalizedCurrency);
  params.set("line_items[0][price_data][unit_amount]", String(amountMinor));
  params.set(
    "line_items[0][price_data][product_data][name]",
    `${documentLabel} #${invoiceNumber}`
  );
  params.set("line_items[0][quantity]", "1");
  params.set("metadata[invoice_number]", invoiceNumber);
  params.set("metadata[document_type]", normalizedDocumentType);

  if (customerEmail) {
    params.set("customer_email", customerEmail);
  }

  params.set(
    "success_url",
    successUrl || toDefaultUrl(requestOrigin, DEFAULT_SUCCESS_PATH)
  );
  params.set(
    "cancel_url",
    cancelUrl || toDefaultUrl(requestOrigin, DEFAULT_CANCEL_PATH)
  );

  const response = await fetch(STRIPE_CHECKOUT_SESSIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const stripeError =
      isRecord(payload) && isRecord(payload.error) ? payload.error : null;
    const stripeMessage =
      stripeError && typeof stripeError.message === "string"
        ? stripeError.message
        : "Stripe rejected payment link creation";
    const stripeCode =
      stripeError && typeof stripeError.code === "string"
        ? stripeError.code
        : undefined;

    throw new HttpError({
      status: response.status >= 500 ? 502 : 400,
      code: "stripe_request_failed",
      message: stripeMessage,
      details: {
        stripeStatus: response.status,
        stripeCode,
      },
    });
  }

  const url = isRecord(payload) && typeof payload.url === "string" ? payload.url : "";

  if (!url) {
    throw new HttpError({
      status: 502,
      code: "stripe_invalid_response",
      message: "Stripe did not return a checkout URL",
    });
  }

  return { url };
};
