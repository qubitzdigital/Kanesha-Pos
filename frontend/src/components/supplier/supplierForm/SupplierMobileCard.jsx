// SupplierMobileCard.jsx
import React from "react";
import { formatPaymentTerms } from "../../../utils/paymentTerms";
import { formatCurrency } from "../../../utils/currency";

const SupplierMobileCard = ({
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
    <div
      className={[
        "group relative",
        "rounded-2xl border border-gray-200 bg-background-secondary",
        "p-4 sm:p-5",
        "shadow-sm transition-all duration-200 ease-out",
        "hover:shadow-md hover:-translate-y-0.5",
        "cursor-pointer",
      ].join(" ")}
      onClick={() => onViewDetails && onViewDetails(supplier)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-base font-bold truncate text-text-primary">
              {supplier.name}
            </div>
            <span className="inline-flex items-center rounded-full bg-primary-subtle px-2 py-0.5 text-[11px] font-semibold text-primary">
              {supplier.supplierCode || "No code"}
            </span>
          </div>

          <div className="mt-1 text-xs text-text-tertiary">
            Terms:{" "}
            <span className="font-semibold text-text-secondary">
              {formatPaymentTerms(supplier.paymentTerms)}
            </span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs font-medium text-text-tertiary">
            Outstanding
          </div>
          <div
            className={[
              "mt-1 text-base font-extrabold tabular-nums",
              outstanding > 0 ? "text-red-600" : "text-success",
            ].join(" ")}
          >
            {formatCurrency(outstanding, currencySymbol, currencyPosition)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierMobileCard;
