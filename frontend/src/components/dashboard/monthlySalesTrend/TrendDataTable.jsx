import React from "react";
import { formatCurrency } from "../../../utils/currency";

const TrendDataTable = ({
  data,
  currencySymbol = "Rs.",
  currencyPosition = "before",
}) => {
  return (
    <div className="bg-white border border-border-light rounded-2xl p-4 sm:p-5">
      <h4 className="text-sm sm:text-base font-medium text-text-secondary mb-3">
        Trend Details
      </h4>
      <div className="overflow-x-auto text-xs sm:text-sm">
        <table className="w-full min-w-[400px]">
          <thead>
            <tr className="border-b border-border-light bg-background-subtle">
              <th className="text-left px-2 py-2.5 text-text-secondary font-medium">
                Period
              </th>
              <th className="text-right px-2 py-2.5 text-text-secondary font-medium">
                Sales ({currencySymbol})
              </th>
              <th className="text-right px-2 py-2.5 text-text-secondary font-medium">
                Invoices
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr
                key={idx}
                className="border-b border-border-light hover:bg-background-subtle transition-colors"
              >
                <td className="px-2 py-2.5 text-text-secondary">{row.month}</td>
                <td className="px-2 py-2.5 text-right text-text-primary font-semibold">
                  {formatCurrency(
                    row.totalSales,
                    currencySymbol,
                    currencyPosition,
                  )}
                </td>
                <td className="px-2 py-2.5 text-right text-text-secondary">
                  {row.invoiceCount}
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="px-2 py-4 text-center text-text-tertiary"
                >
                  No data available for the selected range.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TrendDataTable;
