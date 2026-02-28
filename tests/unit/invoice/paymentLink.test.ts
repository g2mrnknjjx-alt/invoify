import { describe, expect, it } from "vitest";

import {
  hasPaymentLinkUrl,
  normalizePaymentLinkUrl,
  toPaymentLinkDisplayText,
} from "@/lib/invoice/paymentLink";

describe("payment link helpers", () => {
  it("returns empty string for non-string or invalid URL values", () => {
    expect(normalizePaymentLinkUrl(undefined)).toBe("");
    expect(normalizePaymentLinkUrl("")).toBe("");
    expect(normalizePaymentLinkUrl("not-a-url")).toBe("");
    expect(normalizePaymentLinkUrl("javascript:alert(1)")).toBe("");
  });

  it("normalizes valid http/https links", () => {
    expect(
      normalizePaymentLinkUrl(" https://checkout.stripe.com/c/pay/cs_test_123 ")
    ).toBe("https://checkout.stripe.com/c/pay/cs_test_123");
    expect(normalizePaymentLinkUrl("http://example.com/pay")).toBe(
      "http://example.com/pay"
    );
  });

  it("reports whether a payment link is present", () => {
    expect(hasPaymentLinkUrl("https://checkout.stripe.com/c/pay/cs_test_123")).toBe(
      true
    );
    expect(hasPaymentLinkUrl("bad-url")).toBe(false);
  });

  it("renders a short readable payment-link label for invoice output", () => {
    const value = toPaymentLinkDisplayText(
      "https://checkout.stripe.com/c/pay/cs_test_a_very_long_token?prefilled_email=client@example.com"
    );

    expect(value).toContain("checkout.stripe.com");
    expect(value).toContain("…");
    expect(value.length).toBeLessThanOrEqual(32);
  });

  it("supports an explicit max length override", () => {
    const value = toPaymentLinkDisplayText(
      "https://checkout.stripe.com/c/pay/cs_test_a_very_long_token",
      20
    );

    expect(value.length).toBeLessThanOrEqual(20);
  });

  it("returns empty display text for invalid links", () => {
    expect(toPaymentLinkDisplayText("not-a-url")).toBe("");
  });
});
