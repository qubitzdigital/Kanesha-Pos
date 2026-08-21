// SupplierTableRow.jsx
import React from "react";
import { formatPaymentTerms } from "../../../utils/paymentTerms";
import { formatCurrency } from "../../../utils/currency";

const SupplierTableRow = ({
  supplier,
  onViewDetails,
  onReceiveGoods,
  onViewGRNs,
  onPay,
  onEdit,
  onDelete,
  currencySymbol = "Rs.",
  currencyPosition = "before",
}) => {
  const outstanding = Number(supplier.currentBalance || 0);

  return (
    <tr
      className={[
        "cursor-pointer",
        "transition-colors duration-200 ease-out",
        "hover:bg-background-subtle",
      ].join(" ")}
      onClick={() => onViewDetails(supplier)}
    >
      <td className="px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-1">
          <div className="font-semibold text-text-primary">{supplier.name}</div>
          <div className="text-xs text-text-tertiary">
            {supplier.supplierCode || "No code"}
          </div>
        </div>
      </td>

      <td className="px-4 py-4 text-sm text-text-secondary sm:px-6">
        {formatPaymentTerms(supplier.paymentTerms)}
      </td>

      <td className="px-4 py-4 sm:px-6">
        <span
          className={[
            "font-extrabold tabular-nums",
            outstanding > 0 ? "text-red-600" : "text-success",
          ].join(" ")}
        >
          {formatCurrency(outstanding, currencySymbol, currencyPosition)}
        </span>
      </td>

      <td className="px-4 py-4 sm:px-6">
        <div className="flex flex-wrap gap-2">
          <button
            className={[
              "inline-flex items-center justify-center gap-1",
              "rounded-xl px-3 py-2 text-xs font-semibold",
              "bg-accent-subtle text-accent",
              "border border-border-light",
              "transition-all duration-200 ease-out",
              "hover:bg-accent-light hover:shadow-sm hover:-translate-y-[1px]",
              "active:scale-[0.98]",
              "focus:outline-none focus:ring-2 focus:ring-focus/20",
              "cursor-pointer",
            ].join(" ")}
            onClick={(e) => {
              e.stopPropagation();
              onReceiveGoods(supplier);
            }}
          >
            📦 Goods
          </button>

          <button
            className={[
              "inline-flex items-center justify-center gap-1",
              "rounded-xl px-3 py-2 text-xs font-semibold",
              "bg-pending-bg text-pending",
              "border border-border-light",
              "transition-all duration-200 ease-out",
              "hover:shadow-sm hover:-translate-y-[1px]",
              "active:scale-[0.98]",
              "focus:outline-none focus:ring-2 focus:ring-focus/20",
              "cursor-pointer",
            ].join(" ")}
            onClick={(e) => {
              e.stopPropagation();
              onViewGRNs(supplier);
            }}
          >
            📋 GRNs
          </button>

          <button
            className={[
              "inline-flex items-center justify-center gap-1",
              "rounded-xl px-3 py-2 text-xs font-semibold",
              "bg-success-bg text-success",
              "border border-border-light",
              "transition-all duration-200 ease-out",
              "hover:shadow-sm hover:-translate-y-[1px]",
              "active:scale-[0.98]",
              "focus:outline-none focus:ring-2 focus:ring-focus/20",
              "disabled:opacity-60 disabled:cursor-not-allowed",
              "cursor-pointer",
            ].join(" ")}
            onClick={(e) => {
              e.stopPropagation();
              onPay(supplier);
            }}
            disabled={outstanding <= 0}
          >
            💳 Pay
          </button>

          <button
            className={[
              "inline-flex items-center justify-center gap-1",
              "rounded-xl px-3 py-2 text-xs font-semibold",
              "bg-primary-subtle text-primary",
              "border border-border-light",
              "transition-all duration-200 ease-out",
              "hover:shadow-sm hover:-translate-y-[1px]",
              "active:scale-[0.98]",
              "focus:outline-none focus:ring-2 focus:ring-focus/20",
              "cursor-pointer",
            ].join(" ")}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(supplier);
            }}
          >
            ✏️ Edit
          </button>

          <button
            className={[
              "inline-flex items-center justify-center gap-1",
              "rounded-xl px-3 py-2 text-xs font-semibold",
              "bg-error-bg text-red-600",
              "border border-border-light",
              "transition-all duration-200 ease-out",
              "hover:shadow-sm hover:-translate-y-[1px]",
              "active:scale-[0.98]",
              "focus:outline-none focus:ring-2 focus:ring-error/20",
              "cursor-pointer",
            ].join(" ")}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(supplier);
            }}
          >
            🗑️ Delete
          </button>
        </div>
      </td>
    </tr>
  );
};

export default SupplierTableRow;
