// src/utils/paymentTerms.js

export const PAYMENT_TERM_TYPES = [
  { label: "Cash", value: "CASH" },
  { label: "Cash on Delivery (COD)", value: "COD" },
  { label: "Advance", value: "ADVANCE" },
  { label: "Credit (Net)", value: "NET" },
];

export const NET_DAY_OPTIONS = [7, 15, 30, 60];

export function normalizePaymentTerms(pt) {
  // Accept: undefined, string, or object. Normalize to {type, days}
  if (!pt) return { type: "CASH", days: 0 };

  if (typeof pt === "string") {
    // Basic legacy handling. If your old values are like "Net 30" you can parse here.
    const s = pt.trim().toUpperCase();
    if (s.includes("NET")) {
      const match = s.match(/(\d+)/);
      return { type: "NET", days: match ? Number(match[1]) : 0 };
    }
    if (s.includes("COD")) return { type: "COD", days: 0 };
    if (s.includes("ADV")) return { type: "ADVANCE", days: 0 };
    return { type: "CASH", days: 0 };
  }

  // object
  return {
    type: pt.type || "CASH",
    days: Number(pt.days || 0),
  };
}

export function formatPaymentTerms(pt) {
  const t = normalizePaymentTerms(pt);
  if (t.type === "NET") return `Net ${t.days} days`;
  if (t.type === "COD") return "COD";
  if (t.type === "ADVANCE") return "Advance";
  return "Cash";
}
