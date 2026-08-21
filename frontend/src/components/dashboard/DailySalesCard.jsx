import React from "react";
import { formatCurrency } from "../../utils/currency";

/**
 * Daily Sales Card Component
 * Displays today's sales metrics including net profit (after expenses)
 *
 * NOTE: Logic is unchanged. Only styling and layout have been enhanced.
 */
const DailySalesCard = ({
  invoiceCount,
  totalSales,
  grossProfit,
  netProfit,
  totalExpenses,
  totalVAT,
  paymentBreakdown,
  currencySymbol = "Rs.",
  currencyPosition = "before",
}) => {
  return (
    <div className="w-full p-5 bg-white border border-border-light shadow-md rounded-2xl sm:p-6 lg:p-7">
      {/* Header */}
      <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg sm:text-xl font-semibold text-accent/90 flex items-center gap-1.5">
            <span className="text-xl">📈</span>
            <span>Real-Time Sales Overview</span>
          </h3>
          <p className="mt-1 text-xs text-text-secondary sm:text-sm">
            Track performance at a glance – sales, profit, VAT and payment
            methods
          </p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 mb-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* Total Sales */}
        <div className="bg-white border rounded-xl p-4 flex flex-col justify-between transform transition-all duration-150 hover:shadow-sm hover:-translate-y-0.5 cursor-default">
          <div className="pl-3 border-l-4 border-status-pending">
            <p className="mb-1 text-xs text-text-secondary sm:text-sm">
              Total Sales
            </p>
            <p className="text-xl font-bold leading-tight text-text-primary sm:text-2xl">
              {typeof totalSales === "number"
                ? formatCurrency(totalSales, currencySymbol, currencyPosition)
                : formatCurrency(0, currencySymbol, currencyPosition)}
            </p>
          </div>
        </div>

        {/* Invoice Count */}
        <div className="bg-white border rounded-xl p-4 flex flex-col justify-between transform transition-all duration-150 hover:shadow-sm hover:-translate-y-0.5 cursor-default">
          <div className="pl-3 border-l-4 border-purple-500">
            <p className="mb-1 text-xs text-text-secondary sm:text-sm">
              No. of Invoices
            </p>
            <p className="text-xl font-bold leading-tight text-text-primary sm:text-2xl">
              {invoiceCount}
            </p>
          </div>
        </div>

        {/* Gross Profit */}
        <div className="bg-white border rounded-xl p-4 flex flex-col justify-between transform transition-all duration-150 hover:shadow-sm hover:-translate-y-0.5 cursor-default">
          <div className="pl-3 border-l-4 border-status-success">
            <p className="mb-1 text-xs text-text-secondary sm:text-sm">
              Gross Profit
            </p>
            <p className="text-xl font-bold leading-tight text-status-success sm:text-2xl">
              {typeof grossProfit === "number"
                ? formatCurrency(grossProfit, currencySymbol, currencyPosition)
                : formatCurrency(0, currencySymbol, currencyPosition)}
            </p>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-white border rounded-xl p-4 flex flex-col justify-between transform transition-all duration-150 hover:shadow-sm hover:-translate-y-0.5 cursor-default">
          <div className="pl-3 border-l-4 border-emerald-600">
            <p className="mb-1 text-xs text-text-secondary sm:text-sm">
              Net Profit
            </p>
            <p
              className={`text-xl sm:text-2xl font-bold leading-tight ${
                netProfit >= 0 ? "text-emerald-600" : "text-error"
              }`}
            >
              {typeof netProfit === "number"
                ? formatCurrency(netProfit, currencySymbol, currencyPosition)
                : formatCurrency(0, currencySymbol, currencyPosition)}
            </p>
          </div>
        </div>

        {/* VAT Collected */}
        <div className="bg-white border rounded-xl p-4 flex flex-col justify-between transform transition-all duration-150 hover:shadow-sm hover:-translate-y-0.5 cursor-default">
          <div className="pl-3 border-l-4 border-status-warning">
            <p className="mb-1 text-xs text-text-secondary sm:text-sm">
              VAT Collected
            </p>
            <p className="text-xl font-bold leading-tight text-text-primary sm:text-2xl">
              {typeof totalVAT === "number"
                ? formatCurrency(totalVAT, currencySymbol, currencyPosition)
                : formatCurrency(0, currencySymbol, currencyPosition)}
            </p>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white border rounded-xl p-4 flex flex-col justify-between transform transition-all duration-150 hover:shadow-sm hover:-translate-y-0.5 cursor-default">
          <div className="pl-3 border-l-4 border-error">
            <p className="mb-1 text-xs text-text-secondary sm:text-sm">
              Total Expenses
            </p>
            <p className="text-xl font-bold leading-tight text-error sm:text-2xl">
              {typeof totalExpenses === "number"
                ? formatCurrency(
                    totalExpenses,
                    currencySymbol,
                    currencyPosition,
                  )
                : formatCurrency(0, currencySymbol, currencyPosition)}
            </p>
          </div>
        </div>
      </div>

      {/* Payment Breakdown */}
      <div className="mt-4">
        <div className="bg-white border rounded-xl p-4 sm:p-5 transform transition-all duration-150 hover:shadow-sm hover:-translate-y-0.5 cursor-default">
          <div className="flex items-center justify-between gap-2 mb-3">
            <p className="text-sm font-semibold text-text-primary">
              Payment Breakdown
            </p>
            <p className="text-[11px] sm:text-xs text-text-secondary">
              Cash, card, credit and bank totals
            </p>
          </div>

          {/* Desktop / tablet grid view */}
          <div className="hidden grid-cols-2 gap-3 pl-3 border-l-4 border-indigo-500 sm:grid sm:grid-cols-4 sm:gap-4 sm:pl-4">
            <div>
              <p className="text-[11px] sm:text-xs text-text-secondary mb-1">
                Cash
              </p>
              <p className="text-sm font-semibold text-text-primary">
                {paymentBreakdown?.cash
                  ? formatCurrency(
                      paymentBreakdown.cash,
                      currencySymbol,
                      currencyPosition,
                    )
                  : formatCurrency(0, currencySymbol, currencyPosition)}
              </p>
            </div>

            <div>
              <p className="text-[11px] sm:text-xs text-text-secondary mb-1">
                Card
              </p>
              <p className="text-sm font-semibold text-text-primary">
                {paymentBreakdown?.card
                  ? formatCurrency(
                      paymentBreakdown.card,
                      currencySymbol,
                      currencyPosition,
                    )
                  : formatCurrency(0, currencySymbol, currencyPosition)}
              </p>
            </div>

            <div>
              <p className="text-[11px] sm:text-xs text-text-secondary mb-1">
                Credit
              </p>
              <p className="text-sm font-semibold text-text-primary">
                {paymentBreakdown?.credit
                  ? formatCurrency(
                      paymentBreakdown.credit,
                      currencySymbol,
                      currencyPosition,
                    )
                  : formatCurrency(0, currencySymbol, currencyPosition)}
              </p>
            </div>

            <div>
              <p className="text-[11px] sm:text-xs text-text-secondary mb-1">
                Bank
              </p>
              <p className="text-sm font-semibold text-text-primary">
                {paymentBreakdown?.bank
                  ? formatCurrency(
                      paymentBreakdown.bank,
                      currencySymbol,
                      currencyPosition,
                    )
                  : formatCurrency(0, currencySymbol, currencyPosition)}
              </p>
            </div>
          </div>

          {/* Mobile-friendly stacked view */}
          <div className="flex flex-col gap-3 pl-3 mt-1 border-l-4 border-indigo-500 sm:hidden">
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <p className="text-[11px] text-text-secondary">Cash</p>
                <p className="text-xs font-semibold text-text-primary">
                  {paymentBreakdown?.cash
                    ? formatCurrency(
                        paymentBreakdown.cash,
                        currencySymbol,
                        currencyPosition,
                      )
                    : formatCurrency(0, currencySymbol, currencyPosition)}
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-0.5">
                <p className="text-[11px] text-text-secondary">Card</p>
                <p className="text-xs font-semibold text-text-primary">
                  {paymentBreakdown?.card
                    ? formatCurrency(
                        paymentBreakdown.card,
                        currencySymbol,
                        currencyPosition,
                      )
                    : formatCurrency(0, currencySymbol, currencyPosition)}
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-0.5">
                <p className="text-[11px] text-text-secondary">Credit</p>
                <p className="text-xs font-semibold text-text-primary">
                  {paymentBreakdown?.credit
                    ? formatCurrency(
                        paymentBreakdown.credit,
                        currencySymbol,
                        currencyPosition,
                      )
                    : formatCurrency(0, currencySymbol, currencyPosition)}
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-0.5">
                <p className="text-[11px] text-text-secondary">Bank</p>
                <p className="text-xs font-semibold text-text-primary">
                  {paymentBreakdown?.bank
                    ? formatCurrency(
                        paymentBreakdown.bank,
                        currencySymbol,
                        currencyPosition,
                      )
                    : formatCurrency(0, currencySymbol, currencyPosition)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailySalesCard;
