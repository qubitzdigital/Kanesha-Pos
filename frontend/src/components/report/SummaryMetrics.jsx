import React from "react";
import { formatCurrency } from "../../utils/currency";

const SummaryMetrics = ({
  reportData,
  onCardClick,
  currencySymbol = "Rs.",
  currencyPosition = "before",
}) => {
  return (
    <div className="p-5 bg-white border border-gray-200 shadow-md rounded-2xl sm:p-6 lg:p-7">
      <h2 className="mb-5 text-lg font-semibold text-gray-900 sm:text-xl">
        Summary Report
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total Sales */}
        <div
          onClick={() => onCardClick("sales")}
          className="p-5 border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl cursor-pointer hover:shadow-lg hover:scale-105 transition-all group"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">Total Sales</p>
            <svg
              className="w-5 h-5 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </div>
          <p className="mt-2 text-2xl font-bold text-blue-700 sm:text-3xl">
            {formatCurrency(
              reportData.totalSales,
              currencySymbol,
              currencyPosition,
            )}
          </p>
          <p className="text-xs text-blue-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            Click for details →
          </p>
        </div>

        {/* Invoice Count */}
        <div className="p-5 border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
          <p className="text-sm font-medium text-gray-700">No. of Invoices</p>
          <p className="mt-2 text-2xl font-bold text-purple-700 sm:text-3xl">
            {reportData.invoiceCount}
          </p>
        </div>

        {/* Total VAT */}
        <div className="p-5 border border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
          <p className="text-sm font-medium text-gray-700">VAT Collected</p>
          <p className="mt-2 text-2xl font-bold text-orange-700 sm:text-3xl">
            {formatCurrency(
              reportData.totalVAT,
              currencySymbol,
              currencyPosition,
            )}
          </p>
        </div>

        {/* Gross Profit */}
        <div className="p-5 border border-green-200 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
          <p className="text-sm font-medium text-gray-700">Gross Profit</p>
          <p className="mt-2 text-2xl font-bold text-green-700 sm:text-3xl">
            {formatCurrency(
              reportData.grossProfit,
              currencySymbol,
              currencyPosition,
            )}
          </p>
        </div>

        {/* Total Expenses */}
        <div
          onClick={() => onCardClick("expenses")}
          className="p-5 border border-red-200 bg-gradient-to-br from-red-50 to-red-100 rounded-xl cursor-pointer hover:shadow-lg hover:scale-105 transition-all group"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">Total Expenses</p>
            <svg
              className="w-5 h-5 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </div>
          <p className="mt-2 text-2xl font-bold text-red-700 sm:text-3xl">
            {formatCurrency(
              reportData.totalExpenses,
              currencySymbol,
              currencyPosition,
            )}
          </p>
          <p className="text-xs text-red-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            Click for details →
          </p>
        </div>

        {/* Net Profit */}
        <div
          onClick={() => onCardClick("profit")}
          className={`bg-gradient-to-br rounded-xl p-5 border cursor-pointer hover:shadow-lg hover:scale-105 transition-all group ${
            reportData.netProfit >= 0
              ? "from-emerald-50 to-emerald-100 border-emerald-200"
              : "from-red-50 to-red-100 border-red-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">Net Profit</p>
            <svg
              className={`w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity ${
                reportData.netProfit >= 0 ? "text-emerald-600" : "text-red-600"
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </div>
          <p
            className={`text-2xl sm:text-3xl font-bold mt-2 ${
              reportData.netProfit >= 0 ? "text-emerald-700" : "text-red-700"
            }`}
          >
            {formatCurrency(
              reportData.netProfit,
              currencySymbol,
              currencyPosition,
            )}
          </p>
          <p
            className={`text-xs mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${
              reportData.netProfit >= 0 ? "text-emerald-600" : "text-red-600"
            }`}
          >
            Click for breakdown →
          </p>
        </div>
      </div>
    </div>
  );
};

export default SummaryMetrics;
