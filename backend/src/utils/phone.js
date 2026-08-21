// backend/utils/phone.js
export function toE164FromAny(phone, defaultCountryCode = "+94") {
  if (!phone) return "";

  // Remove spaces, dashes, parentheses, etc.
  let raw = String(phone).trim();

  // If already starts with +, normalize to "+[digits]"
  if (raw.startsWith("+")) {
    const digits = raw.replace(/[^\d]/g, ""); // keep only digits
    return "+" + digits;
  }

  const digits = raw.replace(/[^\d]/g, "");

  // 0771234567 -> +94771234567
  if (digits.length === 10 && digits.startsWith("0")) {
    const cc = defaultCountryCode.replace("+", ""); // "94"
    return `+${cc}${digits.slice(1)}`;
  }

  // 94771234567 -> +94771234567
  if (digits.length === 11 && digits.startsWith("94")) {
    return `+${digits}`;
  }

  // Fallback: just prefix + if it looks like a phone number
  if (digits.length >= 7) {
    return `+${digits}`;
  }

  // Otherwise, invalid/unknown
  return "";
}

/**
 * Convert E.164 phone to Notify.lk format (9477XXXXXXX).
 * Accepts any input and normalizes to digits without '+'.
 */
export function toNotifyMsisdn(phone) {
  const e164 = toE164FromAny(phone);
  if (!e164) return "";

  // "+94771234567" -> "94771234567"
  return e164.replace("+", "");
}
