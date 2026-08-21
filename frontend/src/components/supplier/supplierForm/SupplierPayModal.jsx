// src/components/supplier/SupplierPayModal.jsx
import React, { useMemo, useState } from "react";
import colors from "../../../themes/colors";
import CloseButton from "../../common/CloseButton";
import { formatCurrency } from "../../../utils/currency";
const validatePayAmount = (value, outstanding) => {
  const amountNum = Number(value);
  if (Number.isNaN(amountNum) || amountNum <= 0)
    return "Enter an amount greater than 0";
  if (amountNum > outstanding) return "Cannot pay more than outstanding";
  return "";
};

export default function SupplierPayModal({
  open,
  supplier,
  onClose,
  onConfirm, // async (amountNumber) => void
  saving,
  currencySymbol = "Rs.",
  currencyPosition = "before",
}) {
  const outstanding = useMemo(
    () => Number(supplier?.currentBalance || 0),
    [supplier],
  );

  const [amount, setAmount] = useState(() =>
    outstanding > 0 ? outstanding.toFixed(2) : "",
  );
  const [error, setError] = useState("");

  if (!open || !supplier) return null;

  const submit = async () => {
    const msg = validatePayAmount(amount, outstanding);
    if (msg) return setError(msg);

    setError("");
    await onConfirm(Number(amount));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center min-w-full min-h-screen p-4 bg-white/75 backdrop-blur-sm sm:p-6">
      <div className="relative flex flex-col w-full max-w-md mx-auto my-auto mt-20 overflow-hidden transition-all duration-200 ease-out border border-gray-200 shadow-lg lg:mt-32 rounded-3xl bg-background-secondary">
        {/* Top accent bar for consistency with SupplierFormModal */}
        <div className="h-1.5 w-full bg-accent" />

        {/* Soft ambient glows for consistency */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-64 h-64 rounded-full -top-24 -right-24 bg-accent-subtle blur-3xl opacity-70" />
          <div className="absolute rounded-full -bottom-28 -left-28 h-72 w-72 bg-primary-subtle blur-3xl opacity-60" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between w-full gap-4 p-5 border-b border-gray-200 sm:p-6">
          <div className="min-w-0">
            <h3 className="text-lg font-extrabold text-text-primary">
              Record Payment
            </h3>
            <p className="mt-1 text-sm truncate text-text-secondary">
              {supplier.name}
            </p>
          </div>

          <CloseButton
            onClick={() => {
              setError("");
              onClose();
            }}
            size="lg"
            ariaLabel="Close payment modal"
          />
        </div>

        {/* Body */}
        <div className="w-full p-5 space-y-5 sm:p-6">
          <div className="p-4 border border-gray-200 rounded-2xl bg-background-subtle">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-text-secondary">
                Outstanding
              </span>
              <span className="text-lg font-extrabold text-red-600 tabular-nums">
                {formatCurrency(outstanding, currencySymbol, currencyPosition)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-text-primary">
              Payment Amount
            </label>

            <div className="relative">
              <span className="absolute text-sm font-semibold -translate-y-1/2 left-4 top-1/2 text-text-tertiary">
                {currencySymbol}
              </span>
              <input
                type="number"
                step="1"
                className={[
                  "w-full rounded-2xl py-3 pl-12 pr-4 text-sm bg-background-secondary text-text-primary placeholder:text-text-tertiary border focus:outline-none focus:ring-2 focus:border-primary",
                  error
                    ? "border-error bg-error-bg focus:ring-error/20"
                    : "border-gray-200 focus:ring-focus/20",
                  "shadow-sm transition-all duration-200 ease-out hover:shadow-md",
                ].join(" ")}
                value={amount}
                onChange={(e) => {
                  const v = e.target.value;
                  setAmount(v);
                  setError(validatePayAmount(v, outstanding));
                }}
                placeholder="0.00"
              />
            </div>

            {error && (
              <p className="text-xs font-medium text-red-600">{error}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse w-full gap-3 p-5 border-t border-gray-200 sm:flex-row sm:justify-end sm:p-6">
          <button
            onClick={() => {
              setError("");
              onClose();
            }}
            className="inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold border border-gray-200 bg-background-secondary text-text-secondary transition-all duration-200 ease-out hover:bg-background-subtle hover:shadow-sm active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-focus/20 cursor-pointer"
          >
            ✕ Cancel
          </button>

          <button
            onClick={submit}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 bg-primary text-white hover:bg-primary/90 rounded-2xl px-5 py-2.5 text-sm font-semibold bg-primary text-white shadow-md transition-all duration-200 ease-out hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-focus/20 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
          >
            💳 {saving ? "Processing..." : "Confirm Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}
