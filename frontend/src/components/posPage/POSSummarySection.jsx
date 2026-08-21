import React from "react";
import { formatCurrency } from "../../utils/currency";

const POSSummarySection = ({
  baseTotal,
  taxTotal,
  discountTotal,
  setDiscountTotal,
  grandTotal,
  currencySymbol = "Rs.",
  currencyPosition = "before",
}) => {
  return (
    <div className="p-4 border border-border-light bg-background-subtle rounded-2xl sm:p-6">
      <h3 className="mb-4 text-base font-bold text-text-primary sm:text-lg">
        Bill Summary
      </h3>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between items-center py-1.5">
          <span className="text-text-secondary">Sub Total</span>
          <span className="font-medium text-text-primary">
            {formatCurrency(baseTotal, currencySymbol, currencyPosition)}
          </span>
        </div>
        <div className="flex justify-between items-center py-1.5">
          <span className="text-text-secondary">Total VAT</span>
          <span className="font-medium text-text-primary">
            {formatCurrency(taxTotal, currencySymbol, currencyPosition)}
          </span>
        </div>
        <div className="flex justify-between items-center py-1.5 gap-3">
          <span className="text-text-secondary">Bill Discount</span>
          <input
            type="number"
            min="0"
            className="px-3 py-2 text-sm text-right transition-all bg-white border border-border rounded-lg w-28 sm:w-32 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            value={discountTotal}
            onChange={(e) => setDiscountTotal(Number(e.target.value || 0))}
            onWheel={(e) => e.target.blur()}
          />
        </div>
        <div className="pt-3 mt-2 border-t border-border sm:pt-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-text-primary sm:text-xl">
              Grand Total
            </span>
            <span className="text-xl font-bold sm:text-2xl text-primary">
              {formatCurrency(grandTotal, currencySymbol, currencyPosition)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POSSummarySection;
