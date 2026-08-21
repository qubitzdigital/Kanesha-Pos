import React from "react";
import { formatCurrency } from "../../utils/currency";

const DailyBreakdownTable = ({
  dailyBreakdown,
  breakdownError,
  isRangeMode,
  currencySymbol = "Rs.",
  currencyPosition = "before",
}) => {
  if (breakdownError) {
    return (
      <div className="mt-5 p-5 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center">
          <svg
            className="w-5 h-5 text-yellow-600 mr-2"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <p className="font-medium text-yellow-800">
              Unable to load daily breakdown
            </p>
            <p className="text-sm text-yellow-700">{breakdownError}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isRangeMode || dailyBreakdown.length === 0) {
    return null;
  }

  return (
    <div className="mt-5 p-4 bg-white border border-gray-200 shadow-md rounded-2xl sm:p-6 lg:p-7">
      <h3 className="mb-4 text-base font-semibold text-gray-900 sm:text-lg lg:text-xl">
        Daily Breakdown
      </h3>

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sales
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Invoices
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                VAT
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Gross Profit
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Expenses
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Net Profit
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {dailyBreakdown.map((day, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  {day.date}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                  LKR{" "}
                  {day.totalSales.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                  {day.invoiceCount}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                  LKR{" "}
                  {day.totalVAT.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-green-600 font-medium">
                  LKR{" "}
                  {day.grossProfit.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-red-600 font-medium">
                  LKR{" "}
                  {day.totalExpenses.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td
                  className={`px-4 py-3 whitespace-nowrap text-sm text-right font-bold ${
                    day.netProfit >= 0 ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  LKR{" "}
                  {day.netProfit.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {dailyBreakdown.map((day, index) => (
          <div
            key={index}
            className="p-4 border border-gray-200 rounded-xl bg-gray-50 space-y-3"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-300">
              <span className="text-sm font-bold text-gray-900">
                {day.date}
              </span>
              <span className="text-xs font-medium text-gray-600">
                {day.invoiceCount} invoices
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-600 mb-1">Total Sales</p>
                <p className="text-sm font-semibold text-gray-900">
                  LKR{" "}
                  {day.totalSales.toLocaleString("en-US", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-600 mb-1">VAT</p>
                <p className="text-sm font-semibold text-gray-900">
                  LKR{" "}
                  {day.totalVAT.toLocaleString("en-US", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-600 mb-1">Gross Profit</p>
                <p className="text-sm font-semibold text-green-600">
                  LKR{" "}
                  {day.grossProfit.toLocaleString("en-US", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-600 mb-1">Expenses</p>
                <p className="text-sm font-semibold text-red-600">
                  LKR{" "}
                  {day.totalExpenses.toLocaleString("en-US", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-300">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-700">Net Profit</p>
                <p
                  className={`text-base font-bold ${
                    day.netProfit >= 0 ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  LKR{" "}
                  {day.netProfit.toLocaleString("en-US", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DailyBreakdownTable;
