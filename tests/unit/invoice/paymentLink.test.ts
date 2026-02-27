import { describe, expect, it } from "vitest";

import {
  hasPaymentLinkUrl,
  normalizePaymentLinkUrl,
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
});
