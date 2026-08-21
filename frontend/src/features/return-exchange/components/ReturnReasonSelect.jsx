import React from "react";
import { RETURN_REASONS, EXCHANGE_REASONS } from "../constants/returnConstants";

const ReturnReasonSelect = ({
  mode = "return",
  value,
  onChange,
  note,
  onNoteChange,
  error,
}) => {
  const reasons = mode === "exchange" ? EXCHANGE_REASONS : RETURN_REASONS;
  const needsNote = value === "other";

  return (
    <div className="space-y-3">
      <div>
        <label className="block mb-1.5 text-xs font-semibold uppercase tracking-wide text-text-secondary">
          {mode === "exchange" ? "Exchange Reason" : "Return Reason"}{" "}
          <span className="text-error">*</span>
        </label>
        <div className="relative">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={[
              "w-full appearance-none rounded-2xl border px-4 py-2.5 pr-9 text-sm shadow-soft",
              "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer",
              error
                ? "border-error bg-error-subtle text-text-primary"
                : "border-gray-200 bg-background-secondary text-text-primary",
            ].join(" ")}
          >
            <option value="">— Select a reason —</option>
            {reasons.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-text-tertiary">
            ▼
          </span>
        </div>
        {error && (
          <p className="mt-1.5 text-xs font-medium text-error">{error}</p>
        )}
      </div>

      {needsNote && (
        <div>
          <label className="block mb-1.5 text-xs font-semibold uppercase tracking-wide text-text-secondary">
            Describe the reason <span className="text-error">*</span>
          </label>
          <textarea
            value={note || ""}
            onChange={(e) => onNoteChange?.(e.target.value)}
            rows={2}
            placeholder="Briefly describe why…"
            className="w-full rounded-2xl border border-gray-200 bg-background-secondary px-4 py-2.5 text-sm text-text-primary shadow-soft focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      )}
    </div>
  );
};

export default ReturnReasonSelect;
