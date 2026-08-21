// SupplierDetailsSection.jsx
import React, { useMemo } from "react";
import {
  PAYMENT_TERM_TYPES,
  NET_DAY_OPTIONS,
  normalizePaymentTerms,
} from "../../../utils/paymentTerms";

const SupplierDetailsSection = ({ form, errors, isEdit, onFormChange }) => {
  const pt = useMemo(
    () => normalizePaymentTerms(form.paymentTerms),
    [form.paymentTerms],
  );

  return (
    <div className="space-y-6">
      {/* Address */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-text-primary">
          Address <span className="text-red-600">*</span>
        </label>

        <div className="relative">
          <textarea
            rows={3}
            className={[
              "w-full resize-none rounded-2xl px-4 py-3 text-sm",
              "bg-background-secondary text-text-primary placeholder:text-text-tertiary",
              "border focus:outline-none focus:ring-2 focus:border-primary",
              errors.address
                ? "border-error bg-error-bg focus:ring-error/20"
                : "border-gray-200 focus:ring-focus/20",
              "shadow-sm transition-all duration-200 ease-out",
              "hover:shadow-md",
            ].join(" ")}
            value={form.address}
            onChange={(e) => onFormChange({ address: e.target.value })}
          />
        </div>

        {errors.address && (
          <p className="text-xs font-medium text-red-600">{errors.address}</p>
        )}
      </div>

      {/* Payment Terms */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <label className="block text-sm font-semibold text-text-primary">
            Payment Terms
          </label>
          <span className="text-xs text-text-tertiary">
            Set supplier payment conditions
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select
            className={[
              "w-full rounded-2xl px-4 py-3 text-sm",
              "bg-background-secondary text-text-primary",
              "border border-gray-200 shadow-sm",
              "focus:outline-none focus:ring-2 focus:ring-focus/20 focus:border-primary",
              "transition-all duration-200 ease-out hover:shadow-md cursor-pointer",
            ].join(" ")}
            value={pt.type}
            onChange={(e) => {
              const type = e.target.value;
              onFormChange({
                paymentTerms:
                  type === "NET"
                    ? { type, days: form.paymentTerms?.days || 30 }
                    : { type, days: 0 },
              });
            }}
          >
            {PAYMENT_TERM_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            className={[
              "w-full rounded-2xl px-4 py-3 text-sm",
              "bg-background-secondary text-text-primary",
              "border border-gray-200 shadow-sm",
              "focus:outline-none focus:ring-2 focus:ring-focus/20 focus:border-primary",
              "transition-all duration-200 ease-out",
              pt.type !== "NET"
                ? "opacity-60 cursor-not-allowed"
                : "hover:shadow-md cursor-pointer",
            ].join(" ")}
            value={pt.days}
            disabled={pt.type !== "NET"}
            onChange={(e) =>
              onFormChange({
                paymentTerms: {
                  type: "NET",
                  days: Number(e.target.value) || 0,
                },
              })
            }
          >
            {NET_DAY_OPTIONS.map((d) => (
              <option key={d} value={d}>
                Net {d} days
              </option>
            ))}
            <option value={pt.days}>Custom: {pt.days} days</option>
          </select>
        </div>

        {pt.type === "NET" && (
          <div className="p-4 border border-gray-200 shadow-sm rounded-2xl bg-background-secondary">
            <div className="flex items-center justify-between gap-3">
              <label className="block text-xs font-semibold text-text-secondary">
                Custom Net Days (optional)
              </label>
              <span className="text-xs text-text-tertiary">
                Override preset if needed
              </span>
            </div>
            <input
              type="number"
              min={0}
              className={[
                "mt-3 w-full rounded-2xl px-4 py-2.5 text-sm",
                "bg-background-secondary text-text-primary",
                "border border-gray-200 shadow-sm",
                "focus:outline-none focus:ring-2 focus:ring-focus/20 focus:border-primary",
                "transition-all duration-200 ease-out hover:shadow-md",
              ].join(" ")}
              value={pt.days}
              onChange={(e) =>
                onFormChange({
                  paymentTerms: {
                    type: "NET",
                    days: Number(e.target.value) || 0,
                  },
                })
              }
            />
          </div>
        )}

        {errors.paymentTerms && (
          <p className="text-xs font-medium text-red-600">
            {errors.paymentTerms}
          </p>
        )}
      </div>

      {/* Balances */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Opening Balance */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-text-primary">
            Opening Balance <span className="text-red-600">*</span>{" "}
            {isEdit && (
              <span className="text-xs font-medium text-text-tertiary">
                (read-only)
              </span>
            )}
          </label>
          <input
            type="number"
            step="1"
            disabled={isEdit}
            className={[
              "w-full rounded-2xl px-4 py-3 text-sm",
              "bg-background-secondary text-text-primary placeholder hookup",
              "border focus:outline-none focus:ring-2 focus:border-primary",
              errors.openingBalance
                ? "border-error bg-error-bg focus:ring-error/20"
                : "border-gray-200 focus:ring-focus/20",
              "shadow-sm transition-all duration-200 ease-out",
              isEdit ? "opacity-70 cursor-not-allowed" : "hover:shadow-md",
            ].join(" ")}
            value={form.openingBalance}
            onChange={(e) => onFormChange({ openingBalance: e.target.value })}
          />
          {errors.openingBalance && (
            <p className="text-xs font-medium text-red-600">
              {errors.openingBalance}
            </p>
          )}
        </div>

        {/* Credit Limit */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-text-primary">
            Credit Limit <span className="text-red-600">*</span>
          </label>
          <input
            type="number"
            step="1"
            className={[
              "w-full rounded-2xl px-4 py-3 text-sm",
              "bg-background-secondary text-text-primary",
              "border focus:outline-none focus:ring-2 focus:border-primary",
              errors.creditLimit
                ? "border-error bg-error-bg focus:ring-error/20"
                : "border-gray-200 focus:ring-focus/20",
              "shadow-sm transition-all duration-200 ease-out hover:shadow-md",
            ].join(" ")}
            value={form.creditLimit}
            onChange={(e) => onFormChange({ creditLimit: e.target.value })}
            onWheel={(e) => e.target.blur()}
          />
          {errors.creditLimit && (
            <p className="text-xs font-medium text-red-600">
              {errors.creditLimit}
            </p>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-text-primary">
          Status
        </label>
        <select
          className={[
            "w-full rounded-2xl px-4 py-3 text-sm",
            "bg-background-secondary text-text-primary",
            "border border-gray-200 shadow-sm",
            "focus:outline-none focus:ring-2 focus:ring-focus/20 focus:border-primary",
            "transition-all duration-200 ease-out hover:shadow-md cursor-pointer",
          ].join(" ")}
          value={form.status}
          onChange={(e) => onFormChange({ status: e.target.value })}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Notes */}
      <div className="-mb-4 space-y-2">
        <label className="block text-sm font-semibold text-text-primary">
          Notes
        </label>
        <textarea
          rows={2}
          className={[
            "w-full resize-none rounded-2xl px-4 py-3 text-sm",
            "bg-background-secondary text-text-primary placeholder:text-text-tertiary",
            "border border-gray-200 shadow-sm",
            "focus:outline-none focus:ring-2 focus:ring-focus/20 focus:border-primary",
            "transition-all duration-200 ease-out hover:shadow-md",
          ].join(" ")}
          value={form.notes}
          onChange={(e) => onFormChange({ notes: e.target.value })}
        />
      </div>
    </div>
  );
};

export default SupplierDetailsSection;
