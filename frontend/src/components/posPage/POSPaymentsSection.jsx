import React from "react";
import { formatCurrency } from "../../utils/currency";

const POSPaymentsSection = ({
  payments,
  paymentErrors,
  updatePayment,
  addPaymentRow,
  deletePaymentRow,
  totalPayments,
  grandTotal,
  currencySymbol = "Rs.",
  currencyPosition = "before",
}) => {
  return (
    <div className="p-4 border border-border-light bg-background-subtle rounded-2xl sm:p-6">
      <div className="flex flex-col items-start justify-between gap-3 mb-4 sm:flex-row sm:items-center">
        <h3 className="text-base font-bold text-text-primary sm:text-lg">
          Payments
        </h3>
        <button
          type="button"
          onClick={addPaymentRow}
          className="self-stretch px-4 py-2 text-sm font-medium text-white transition-all duration-200 border rounded-lg cursor-pointer border-accent bg-accent hover:bg-accent/90 active:scale-95 sm:self-auto"
        >
          + Add Payment
        </button>
      </div>

      <div className="space-y-4">
        {payments.map((p, idx) => {
          const err = paymentErrors[idx] || {};
          const paymentsSoFar = payments
            .slice(0, idx)
            .reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
          const balance = grandTotal - paymentsSoFar - (Number(p.amount) || 0);

          return (
            <div
              key={idx}
              className="p-4 space-y-3 bg-white border border-border-light rounded-xl"
            >
              <div className="grid items-end grid-cols-1 gap-3 md:grid-cols-12 md:gap-4">
                <div className="md:col-span-4">
                  <label className="block mb-2 text-xs font-medium text-text-secondary">
                    Method
                  </label>
                  <select
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                      err.method
                        ? "border-error/40 bg-error-subtle"
                        : "border-border"
                    }`}
                    value={p.method}
                    onChange={(e) =>
                      updatePayment(idx, { method: e.target.value })
                    }
                  >
                    <option value="cash">💵 Cash</option>
                    <option value="card">💳 Card</option>
                    <option value="bank">🏦 Bank Transfer</option>
                  </select>
                  {err.method && (
                    <p className="mt-1 text-xs text-error">{err.method}</p>
                  )}
                </div>

                <div className="md:col-span-4">
                  <label className="block mb-2 text-xs font-medium text-text-secondary">
                    Amount
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className={`w-full px-3 py-2 border rounded-lg text-right text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                      err.amount
                        ? "border-error/40 bg-error-subtle"
                        : "border-border"
                    }`}
                    value={p.amount}
                    onChange={(e) =>
                      updatePayment(idx, {
                        amount: Number(e.target.value || 0),
                      })
                    }
                    onWheel={(e) => e.target.blur()}
                    placeholder="0.00"
                  />
                  {err.amount && (
                    <p className="mt-1 text-xs text-right text-error">
                      {err.amount}
                    </p>
                  )}
                </div>

                <div className="md:col-span-3">
                  <div
                    className={`px-3 py-2 border rounded-lg text-right font-medium text-xs sm:text-sm ${
                      balance < 0
                        ? "bg-error-subtle border-error/30 text-error-hover"
                        : balance === 0
                          ? "bg-status-success-bg border-status-success/30 text-status-success"
                          : "bg-status-pending-bg border-status-pending/30 text-status-pending"
                    }`}
                  >
                    {balance.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-text-tertiary text-right mt-1">
                    Balance
                  </div>
                </div>

                <div className="flex justify-end md:col-span-1">
                  {payments.length > 1 && (
                    <button
                      type="button"
                      onClick={() => deletePaymentRow(idx)}
                      className="flex items-center justify-center text-error transition-colors rounded-lg cursor-pointer w-9 h-9 hover:bg-error-subtle"
                      title="Remove payment"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <div className="p-4 bg-white border border-border-light rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">
              Total Payments
            </span>
            <span className="text-lg font-bold text-text-primary sm:text-xl">
              {formatCurrency(totalPayments, currencySymbol, currencyPosition)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POSPaymentsSection;
