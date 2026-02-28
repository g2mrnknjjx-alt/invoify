export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

import { invoicePaymentLinkRequestSchema } from "@/lib/contracts/invoiceApi";
import { HttpError, toHttpErrorResponse } from "@/lib/server/httpError";
import { createStripePaymentLinkService } from "@/services/invoice/server/createStripePaymentLinkService";

export async function POST(req: NextRequest) {
  try {
    let body: unknown;

    try {
      body = await req.json();
    } catch {
      throw new HttpError({
        status: 400,
        code: "invalid_json",
        message: "Request body must be valid JSON",
      });
    }

    const parsed = invoicePaymentLinkRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError({
        status: 400,
        code: "validation_error",
        message: "Invalid payment-link payload",
        details: parsed.error.flatten(),
      });
    }

    const result = await createStripePaymentLinkService({
      ...parsed.data,
      requestOrigin: req.nextUrl.origin,
    });

    return NextResponse.json({
      ok: true,
      url: result.url,
      qrCodeDataUrl: result.qrCodeDataUrl,
    });
  } catch (error) {
    const shouldReportServerError =
      !(error instanceof HttpError) || error.status >= 500;

    if (shouldReportServerError) {
      Sentry.captureException(error, {
        tags: {
          route: "/api/invoice/payment-link",
        },
      });
    }

    return toHttpErrorResponse(error, {
      code: "create_payment_link_error",
      message: "Failed to create payment link",
    });
  }
}
