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

const truncateMiddle = (value: string, maxLength: number): string => {
  if (value.length <= maxLength) return value;
  if (maxLength <= 1) return "…";

  const headLength = Math.max(8, Math.floor((maxLength - 1) * 0.7));
  const tailLength = Math.max(4, maxLength - 1 - headLength);
  return `${value.slice(0, headLength)}…${value.slice(-tailLength)}`;
};

export const toPaymentLinkDisplayText = (
  value: unknown,
  maxLength = 32
): string => {
  const normalized = normalizePaymentLinkUrl(value);
  if (!normalized) return "";

  try {
    const parsed = new URL(normalized);
    const path = parsed.pathname === "/" ? "" : parsed.pathname;
    const withQueryHint = parsed.search ? `${parsed.hostname}${path}?…` : `${parsed.hostname}${path}`;
    return truncateMiddle(withQueryHint, maxLength);
  } catch {
    return truncateMiddle(normalized, maxLength);
  }
};
