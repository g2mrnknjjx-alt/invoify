import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { HttpError } from "@/lib/server/httpError";

const { createStripePaymentLinkServiceMock } = vi.hoisted(() => ({
  createStripePaymentLinkServiceMock: vi.fn(),
}));

vi.mock("@/services/invoice/server/createStripePaymentLinkService", () => ({
  createStripePaymentLinkService: createStripePaymentLinkServiceMock,
}));

import { POST } from "@/app/api/invoice/payment-link/route";

describe("/api/invoice/payment-link", () => {
  beforeEach(() => {
    createStripePaymentLinkServiceMock.mockReset();
  });

  it("returns structured invalid_json error", async () => {
    const req = new NextRequest("http://localhost/api/invoice/payment-link", {
      method: "POST",
      body: "not-json",
      headers: {
        "content-type": "application/json",
      },
    });

    const res = await POST(req);
    const payload = await res.json();

    expect(res.status).toBe(400);
    expect(payload).toMatchObject({
      error: {
        code: "invalid_json",
        message: expect.any(String),
      },
    });
    expect(createStripePaymentLinkServiceMock).not.toHaveBeenCalled();
  });

  it("returns validation error for invalid payload", async () => {
    const req = new NextRequest("http://localhost/api/invoice/payment-link", {
      method: "POST",
      body: JSON.stringify({
        currency: "usd",
      }),
      headers: {
        "content-type": "application/json",
      },
    });

    const res = await POST(req);
    const payload = await res.json();

    expect(res.status).toBe(400);
    expect(payload.error.code).toBe("validation_error");
    expect(createStripePaymentLinkServiceMock).not.toHaveBeenCalled();
  });

  it("passes validated payload to service", async () => {
    createStripePaymentLinkServiceMock.mockResolvedValueOnce({
      url: "https://checkout.stripe.com/c/pay/cs_test_123",
    });

    const req = new NextRequest("http://localhost/api/invoice/payment-link", {
      method: "POST",
      body: JSON.stringify({
        invoiceNumber: "INV-100",
        documentType: "invoice",
        currency: "USD",
        amount: 109.99,
        customerEmail: "client@example.com",
      }),
      headers: {
        "content-type": "application/json",
      },
    });

    const res = await POST(req);
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(payload).toEqual({
      ok: true,
      url: "https://checkout.stripe.com/c/pay/cs_test_123",
    });
    expect(createStripePaymentLinkServiceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        invoiceNumber: "INV-100",
        documentType: "invoice",
        currency: "usd",
        amount: 109.99,
        customerEmail: "client@example.com",
        requestOrigin: "http://localhost",
      })
    );
  });

  it("returns passthrough HttpError payload from service", async () => {
    createStripePaymentLinkServiceMock.mockRejectedValueOnce(
      new HttpError({
        status: 500,
        code: "stripe_not_configured",
        message: "Stripe is not configured. Set STRIPE_SECRET_KEY.",
      })
    );

    const req = new NextRequest("http://localhost/api/invoice/payment-link", {
      method: "POST",
      body: JSON.stringify({
        invoiceNumber: "INV-100",
        currency: "USD",
        amount: 109.99,
      }),
      headers: {
        "content-type": "application/json",
      },
    });

    const res = await POST(req);
    const payload = await res.json();

    expect(res.status).toBe(500);
    expect(payload).toMatchObject({
      error: {
        code: "stripe_not_configured",
        message: "Stripe is not configured. Set STRIPE_SECRET_KEY.",
      },
    });
  });

  it("returns structured fallback error for unexpected failures", async () => {
    createStripePaymentLinkServiceMock.mockRejectedValueOnce(new Error("boom"));

    const req = new NextRequest("http://localhost/api/invoice/payment-link", {
      method: "POST",
      body: JSON.stringify({
        invoiceNumber: "INV-100",
        currency: "USD",
        amount: 109.99,
      }),
      headers: {
        "content-type": "application/json",
      },
    });

    const res = await POST(req);
    const payload = await res.json();

    expect(res.status).toBe(500);
    expect(payload).toMatchObject({
      error: {
        code: "create_payment_link_error",
        message: "Failed to create payment link",
      },
    });
  });
});
