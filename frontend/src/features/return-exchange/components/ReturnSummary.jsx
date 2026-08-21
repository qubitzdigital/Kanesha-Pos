import React from "react";
import { formatCurrency } from "../../../utils/currency";

const REASON_LABELS = {
  defective: "Defective / Damaged",
  wrong_item: "Wrong Item Delivered",
  not_needed: "No Longer Needed",
  quality: "Poor Quality",
  overcharged: "Overcharged / Billing Error",
  wrong_size: "Wrong Size / Specification",
  upgrade: "Upgrade to Different Product",
  other: "Other",
};

const REFUND_LABELS = {
  cash: "💵 Cash Refund",
  store_credit: "🏷️ Store Credit",
  bank: "🏦 Bank Transfer",
};

const Row = ({ label, value, highlight }) => (
  <div className="flex items-center justify-between py-1.5 text-sm">
    <span className="text-text-secondary">{label}</span>
    <span
      className={
        highlight
          ? "font-bold text-status-success-DEFAULT"
          : "font-semibold text-text-primary"
      }
    >
      {value}
    </span>
  </div>
);

const ReturnSummary = ({
  mode = "return",
  sale,
  item,
  size,
  returnQty,
  billingPrice,
  reason,
  refundMethod,
  currencySymbol = "Rs.",
  currencyPosition = "before",
}) => {
  const refundTotal = returnQty * (Number(billingPrice) || 0);

  if (!sale || !item) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-background-secondary py-12 text-center shadow-soft">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background-subtle">
          <span className="text-xl">📋</span>
        </div>
        <p className="text-sm font-semibold text-text-primary">
          No summary yet
        </p>
        <p className="text-xs text-text-tertiary">Scan a product to begin</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-background-secondary shadow-soft">
      <div
        className={`h-1.5 w-full ${mode === "exchange" ? "bg-accent" : "bg-primary"}`}
      />

      <div className="p-5 space-y-4">
        {/* Badge */}
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-text-primary">
            {mode === "exchange" ? "Exchange Summary" : "Return Summary"}
          </h4>
          <span
            className={`rounded-xl px-3 py-1 text-xs font-bold ${
              mode === "exchange"
                ? "bg-accent-subtle text-accent"
                : "bg-primary-subtle text-primary"
            }`}
          >
            {mode === "exchange" ? "🔄 Exchange" : "↩ Return"}
          </span>
        </div>

        {/* Sale */}
        <div className="rounded-xl bg-background-subtle px-4 py-3 space-y-0.5">
          <Row label="Invoice" value={sale.invoiceNumber} />
          <Row label="Customer" value={sale.customerName} />
          <Row label="Date" value={sale.date} />
        </div>

        {/* Product */}
        <div className="rounded-xl bg-background-subtle px-4 py-3 space-y-0.5">
          <Row label="Product" value={item.sku} />
          {size && <Row label="Size" value={size} />}
          <Row label="Return Qty" value={`${returnQty} ${item.unit}`} />
          <Row
            label="Billing Price"
            value={
              Number(billingPrice) > 0
                ? formatCurrency(billingPrice, currencySymbol, currencyPosition)
                : "—"
            }
          />
        </div>

        {/* Reason */}
        <div className="rounded-xl bg-background-subtle px-4 py-3 space-y-0.5">
          <Row label="Reason" value={REASON_LABELS[reason] || reason || "—"} />
          {mode === "return" && (
            <Row
              label="Refund Via"
              value={REFUND_LABELS[refundMethod] || refundMethod || "—"}
            />
          )}
        </div>

        {/* Total */}
        <div className="border-t border-gray-200 pt-3">
          <Row
            label={mode === "exchange" ? "Return Credit" : "Total Refund"}
            value={
              Number(billingPrice) > 0
                ? formatCurrency(refundTotal, currencySymbol, currencyPosition)
                : "—"
            }
            highlight
          />
        </div>

        <p className="text-[11px] leading-relaxed text-text-tertiary">
          ⚠ Review all details before confirming. Stock and sales records will
          be updated.
          {/* TODO: ADD BACKEND CODE HERE — trigger receipt print/email after successful submission */}
        </p>
      </div>
    </div>
  );
};

export default ReturnSummary;
