import React from "react";
import { formatCurrency } from "../../../utils/currency";

const GRNTotalsSection = ({
  totals,
  currencySymbol = "Rs.",
  currencyPosition = "before",
}) => {
  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-gray-600">Total Qty:</span>
        <span className="font-semibold text-gray-900">{totals.totalQty}</span>
      </div>
      <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
        <span className="font-medium text-gray-700">Grand Total:</span>
        <span className="text-lg font-bold text-primary">
          {formatCurrency(totals.grandTotal, currencySymbol, currencyPosition)}
        </span>
      </div>
    </div>
  );
};

export default GRNTotalsSection;
