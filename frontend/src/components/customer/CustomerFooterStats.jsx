import React from "react";
import { formatCurrency } from "../../utils/currency";

const CustomerFooterStats = ({
  customers,
  currencySymbol = "Rs.",
  currencyPosition = "before",
}) => {
  if (customers.length === 0) return null;

  const totalCreditLimit = customers
    .reduce((sum, c) => sum + (c.creditLimit || 0), 0)
    .toFixed(2);

  const totalOutstanding = customers
    .reduce((sum, c) => sum + (c.currentBalance || 0), 0)
    .toFixed(2);

  return (
    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
      <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="text-sm text-center text-gray-600 md:text-left">
          Showing {customers.length} customer
          {customers.length !== 1 ? "s" : ""}
        </div>
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <div className="text-sm text-gray-700">
            <span className="font-medium">Total Credit Limit:</span>
            <span className="ml-2 font-bold">
              {formatCurrency(
                totalCreditLimit,
                currencySymbol,
                currencyPosition,
              )}
            </span>
          </div>
          <div className="text-sm text-gray-700">
            <span className="font-medium">Total Outstanding:</span>
            <span className="ml-2 font-bold text-red-600">
              {formatCurrency(
                totalOutstanding,
                currencySymbol,
                currencyPosition,
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerFooterStats;
