import React from "react";
import AppLoader from "../common/AppLoader";
import { formatCurrency } from "../../utils/currency";

/**
 * Expenses Summary Card Component
 * Displays total expenses, count, and breakdown by category
 */
const ExpensesSummaryCard = ({
  totalExpenses = 0,
  expenseCount = 0,
  categoryBreakdown = [],
  loading = false,
  currencySymbol = "Rs.",
  currencyPosition = "before",
}) => {
  return (
    <div className="w-full p-5 bg-white border border-border-light shadow-md rounded-2xl sm:p-6 lg:p-7">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg sm:text-xl font-semibold text-accent/90 flex items-center gap-1.5">
            <span className="text-xl">💰</span>
            <span>Expenses</span>
          </h3>
          <p className="mt-1 text-xs text-text-secondary sm:text-sm">
            Breakdown of operating expenses by category
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <AppLoader
            open
            variant="inline"
            title="Loading expenses"
            subtitle="Compiling expense summary"
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Total Expenses Summary */}
          <div className="p-4 border border-status-warning/30 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-text-secondary sm:text-sm">
                  Total Expenses
                </p>
                <p className="mt-1 text-2xl font-bold text-status-warning sm:text-3xl">
                  {typeof totalExpenses === "number"
                    ? formatCurrency(
                        totalExpenses,
                        currencySymbol,
                        currencyPosition,
                      )
                    : formatCurrency(0, currencySymbol, currencyPosition)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-text-secondary sm:text-base">
                  {expenseCount}
                </p>
                <p className="text-xs text-text-tertiary">
                  expense{expenseCount !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          {categoryBreakdown && categoryBreakdown.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold tracking-wide text-text-secondary uppercase">
                By Category
              </p>

              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {categoryBreakdown.map((item, idx) => {
                  const percentage =
                    totalExpenses > 0
                      ? Math.round((item.amount / totalExpenses) * 100)
                      : 0;

                  return (
                    <div key={idx} className="flex items-stretch gap-3 py-1">
                      <div className="flex-1">
                        {/* Desktop / tablet header row */}
                        <div className="items-center justify-between hidden mb-1 sm:flex">
                          <p className="text-xs font-medium text-text-secondary sm:text-sm">
                            {item.category}
                          </p>
                          <p className="text-xs font-semibold text-text-primary sm:text-sm">
                            {percentage}%
                          </p>
                        </div>

                        {/* Mobile-friendly stacked header */}
                        <div className="flex flex-col sm:hidden mb-1 gap-0.5">
                          <p className="text-xs font-medium text-text-secondary">
                            {item.category}
                          </p>
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] text-text-tertiary">
                              Share of total
                            </p>
                            <p className="text-xs font-semibold text-text-primary">
                              {percentage}%
                            </p>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full h-2 bg-background-disabled rounded-full">
                          <div
                            className="h-2 transition-all duration-300 rounded-full bg-gradient-to-r from-orange-500 to-red-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>

                        {/* Amount */}
                        <p className="text-[10px] sm:text-xs text-text-tertiary mt-0.5 flex justify-between sm:justify-start sm:gap-2">
                          <span className="hidden sm:inline">Amount:</span>
                          <span>
                            {formatCurrency(
                              item.amount,
                              currencySymbol,
                              currencyPosition,
                            )}
                          </span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 rounded-lg bg-background-subtle">
              <p className="text-sm text-text-tertiary">No expenses recorded</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExpensesSummaryCard;
