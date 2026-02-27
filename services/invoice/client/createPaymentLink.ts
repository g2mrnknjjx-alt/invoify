import { toApiErrorMessage } from "@/lib/contracts/invoiceApi";
import { CREATE_PAYMENT_LINK_API } from "@/lib/variables";

type CreatePaymentLinkArgs = {
  invoiceNumber: string;
  documentType?: "invoice" | "quote";
  currency: string;
  amount: number;
  customerEmail?: string;
  successUrl?: string;
  cancelUrl?: string;
};

export const createPaymentLink = async ({
  invoiceNumber,
  documentType,
  currency,
  amount,
  customerEmail,
  successUrl,
  cancelUrl,
}: CreatePaymentLinkArgs): Promise<string> => {
  const response = await fetch(CREATE_PAYMENT_LINK_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      invoiceNumber,
      documentType,
      currency,
      amount,
      customerEmail,
      successUrl,
      cancelUrl,
    }),
  });

  if (!response.ok) {
    let errorPayload: unknown = null;
    try {
      errorPayload = await response.json();
    } catch {
      // no-op
    }

    throw new Error(
      toApiErrorMessage(
        errorPayload,
        `Failed to create payment link (${response.status})`
      )
    );
  }

  const payload = (await response.json()) as { url?: unknown };
  if (typeof payload.url !== "string" || payload.url.trim().length === 0) {
    throw new Error("Payment link response is missing url");
  }

  return payload.url;
};
