import React, { useEffect, useState } from "react";
import AppLoader from "../common/AppLoader";
import CloseButton from "../common/CloseButton";
import { formatCurrency } from "../../utils/currency";

const defaultForm = {
  amount: "",
  method: "cash",
  reference: "",
  note: "",
};

const ReceivePaymentModal = ({
  open,
  customer,
  onClose,
  onSubmit,
  saving,
  currencySymbol = "Rs.",
  currencyPosition = "before",
}) => {
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (open) {
      setForm(defaultForm);
    }
  }, [open]);

  if (!open || !customer) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const amountNum = Number(form.amount);
    if (Number.isNaN(amountNum) || amountNum <= 0)
      return showError("Please enter a valid amount");
    if (
      typeof customer.currentBalance === "number" &&
      amountNum > customer.currentBalance
    )
      return showError("Payment cannot exceed outstanding balance");

    onSubmit({
      amount: amountNum,
      method: form.method,
      reference: form.reference,
      note: form.note,
    });
  };

  return (
    <>
      <AppLoader
        open={saving}
        title="Processing payment"
        subtitle="Recording customer payment"
      />
      <div className="fixed inset-0 bg-white/75 backdrop-blur-sm flex items-center justify-center z-50 px-3">
        <div className="bg-white rounded-2xl p-5 w-full max-w-md shadow-lg">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-800">
              Receive Payment
            </h3>
            <CloseButton
              onClick={onClose}
              size="md"
              ariaLabel="Close payment modal"
            />
          </div>

          <form className="space-y-3" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Customer
              </label>
              <input
                type="text"
                className="w-full border rounded-xl px-3 py-2 text-sm bg-gray-100"
                value={customer.name}
                disabled
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Outstanding:{" "}
                {formatCurrency(
                  Number(customer.currentBalance || 0),
                  currencySymbol,
                  currencyPosition,
                )}
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">
                Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={form.amount}
                onChange={(e) =>
                  setForm((p) => ({ ...p, amount: e.target.value }))
                }
                placeholder="Enter payment amount"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">
                Payment Method <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                value={form.method}
                onChange={(e) =>
                  setForm((p) => ({ ...p, method: e.target.value }))
                }
                required
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">
                Reference (Optional)
              </label>
              <input
                type="text"
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={form.reference}
                onChange={(e) =>
                  setForm((p) => ({ ...p, reference: e.target.value }))
                }
                placeholder="e.g., Check number, transaction ID"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">
                Note (Optional)
              </label>
              <textarea
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={form.note}
                onChange={(e) =>
                  setForm((p) => ({ ...p, note: e.target.value }))
                }
                placeholder="Additional notes"
                rows="2"
              />
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 border rounded-xl text-sm hover:bg-gray-50 cursor-pointer disabled:opacity-60"
                disabled={saving}
              >
                ✕ Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm hover:bg-primary/90 cursor-pointer disabled:opacity-50"
                disabled={saving}
              >
                {saving ? "⏳ Processing..." : "💳 Receive Payment"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default ReceivePaymentModal;
