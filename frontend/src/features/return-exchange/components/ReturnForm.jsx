import React from "react";
import { formatCurrency } from "../../../utils/currency";
import ReturnReasonSelect from "./ReturnReasonSelect";

// TODO: ADD BACKEND CODE HERE — submit return via returnApi.createReturn(payload)
// On success: increase item stock by returnQty, reduce sale total, reduce profit, update dashboard

const ReturnForm = ({
  item,
  returnQty,
  billingPrice,
  reason,
  onReasonChange,
  reasonNote,
  onReasonNoteChange,
  onSubmit,
  isSubmitting,
  errors = {},
  currencySymbol = "Rs.",
  currencyPosition = "before",
}) => {
  const refundTotal = returnQty * (Number(billingPrice) || 0);
  const canSubmit = reason && Number(billingPrice) > 0 && !isSubmitting;

  return (
    <div className="space-y-4">
      {/* Reason */}
      <div className="rounded-2xl border border-gray-200 bg-background-secondary p-5 shadow-soft">
        <ReturnReasonSelect
          mode="return"
          value={reason}
          onChange={onReasonChange}
          note={reasonNote}
          onNoteChange={onReasonNoteChange}
          error={errors.reason}
        />
      </div>

      {/* Impact info */}
      <div className="rounded-2xl border border-gray-200 bg-background-subtle px-5 py-4 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-1">
          On Confirm
        </p>
        {[
          { icon: "📦", text: `Stock +${returnQty} ${item?.unit ?? ""}` },
          { icon: "📉", text: `Sales reduced by ${formatCurrency(refundTotal, currencySymbol, currencyPosition)}` },
          { icon: "💹", text: "Profit & dashboard updated" },
        ].map(({ icon, text }) => (
          <div key={text} className="flex items-center gap-2 text-xs text-text-secondary">
            <span>{icon}</span><span>{text}</span>
          </div>
        ))}
      </div>

      {/* Submit */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit}
        className={[
          "w-full rounded-2xl px-6 py-3.5 text-sm font-bold text-text-inverse shadow-card",
          "transition-all active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary/30",
          canSubmit
            ? "bg-primary hover:bg-primary-hover hover:-translate-y-0.5 hover:shadow-float cursor-pointer"
            : "bg-primary/40 cursor-not-allowed",
        ].join(" ")}
      >
        {isSubmitting ? (
          <span className="inline-flex items-center justify-center gap-2">
            <span className="inline-block h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            Processing Return…
          </span>
        ) : (
          `Process Return · ${formatCurrency(refundTotal, currencySymbol, currencyPosition)}`
        )}
      </button>
    </div>
  );
};

export default ReturnForm;
