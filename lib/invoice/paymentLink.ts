export const normalizePaymentLinkUrl = (value: unknown): string => {
  if (typeof value !== "string") return "";

  const trimmed = value.trim();
  if (!trimmed) return "";

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return "";
    }

    return parsed.toString();
  } catch {
    return "";
  }
};

export const hasPaymentLinkUrl = (value: unknown): boolean => {
  return normalizePaymentLinkUrl(value).length > 0;
};
