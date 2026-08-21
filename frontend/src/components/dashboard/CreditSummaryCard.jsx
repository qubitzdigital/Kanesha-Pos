import React from "react";
import AppLoader from "../common/AppLoader";
import { formatCurrency } from "../../utils/currency";

/**
 * Outstanding Customer Credit Summary Component
 * Shows total credit given and top customers owing money
 *
 * NOTE: Logic is unchanged. Only styling and layout have been enhanced.
 */
const CreditSummaryCard = ({
  totalCreditGiven,
  topCustomers,
  warningCount,
  loading = false,
  currencySymbol = "Rs.",
  currencyPosition = "before",
}) => {
  const hasCustomers = topCustomers && topCustomers.length > 0;

  return (
    <div className="w-full p-5 bg-white border border-border-light shadow-md rounded-2xl sm:p-6 lg:p-7">
      {/* Header */}
      <div className="flex flex-col gap-3 mb-5 sm:flex-row sm:items-center sm:justify-between sm:mb-6">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold sm:text-xl text-accent/90">
            <span className="text-xl sm:text-2xl">💳</span>
            <span>Outstanding Customer Credit Summary</span>
          </h3>
          <p className="mt-1 text-xs text-text-secondary sm:text-sm">
            Monitor your total credit exposure and keep an eye on customers
            approaching their limits.
          </p>
        </div>
      </div>

      {/* Summary Top Strip for smaller screens */}
      <div className="mb-5 sm:hidden">
        <div className="px-4 py-3 border border-status-pending/30 bg-status-pending-bg rounded-xl">
          <p className="mb-1 text-xs text-text-secondary">Total Credit Given</p>
          <p className="text-2xl font-bold text-status-pending">
            {typeof totalCreditGiven === "number"
              ? formatCurrency(
                  totalCreditGiven,
                  currencySymbol,
                  currencyPosition,
                )
              : formatCurrency(0, currencySymbol, currencyPosition)}
          </p>
          {warningCount > 0 && (
            <p className="text-[11px] text-status-warning mt-2 font-medium">
              ⚠️ {warningCount} customer(s) nearing credit limit
            </p>
          )}
        </div>
      </div>

      {/* Main Summary & Stats Row (tablet/desktop) */}
      <div className="hidden grid-cols-1 gap-4 mb-6 sm:grid md:grid-cols-3">
        <div className="flex flex-col justify-center px-4 py-4 border border-status-warning/30 md:col-span-2 bg-status-warning-bg rounded-xl">
          <p className="mb-1 text-xs text-text-secondary sm:text-sm">
            Total Credit Given
          </p>
          <p className="text-2xl font-bold text-status-warning md:text-3xl">
            {typeof totalCreditGiven === "number"
              ? formatCurrency(
                  totalCreditGiven,
                  currencySymbol,
                  currencyPosition,
                )
              : formatCurrency(0, currencySymbol, currencyPosition)}
          </p>
        </div>
        <div className="flex flex-col items-start justify-center px-4 py-4 bg-white border border-border-light md:items-center rounded-xl">
          <p className="mb-1 text-xs text-error sm:text-sm">
            Credit Limit Alerts
          </p>
          <p
            className={`text-sm font-semibold sm:text-base ${
              warningCount > 0
                ? "text-error-hover bg-error-subtle"
                : "text-text-tertiary"
            }`}
          >
            {warningCount > 0
              ? `${warningCount} customer(s) nearing limit`
              : "No current alerts"}
          </p>

          {warningCount > 0 && (
            <span className="mt-2 inline-flex items-center text-[11px] font-semibold bg-status-warning-bg text-status-warning-text px-2 py-1 rounded-full">
              ⚠️ Attention needed
            </span>
          )}
        </div>
      </div>

      {/* Top Customers Section */}
      <div className="pt-5 border-t border-border-light sm:pt-6">
        <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
          <h4 className="text-sm font-semibold text-text-primary sm:text-base">
            Top Customers Owing Money
          </h4>
          {hasCustomers && (
            <p className="text-[11px] sm:text-xs text-text-tertiary">
              Showing {topCustomers.length} customer
              {topCustomers.length > 1 ? "s" : ""}
            </p>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <AppLoader
              open
              variant="inline"
              title="Loading credit data"
              subtitle="Fetching customer balances"
            />
          </div>
        ) : hasCustomers ? (
          <>
            {/* Mobile-friendly compact cards */}
            <div className="space-y-3 sm:hidden">
              {topCustomers.map((customer) => {
                const isWarning = customer.status === "warning";
                const percentage = Math.min(
                  customer.creditPercentage || 0,
                  100,
                );

                return (
                  <div
                    key={customer._id}
                    className={`rounded-xl border p-3 transition-all duration-150 ${
                      isWarning
                        ? "bg-status-warning-bg border-status-warning/30"
                        : "bg-background-subtle border-border-light"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {customer.name}
                        </p>
                        {customer.phone && (
                          <p className="text-[11px] text-text-tertiary mt-0.5">
                            {customer.phone}
                          </p>
                        )}
                      </div>
                      {isWarning && (
                        <span className="inline-flex items-center text-[10px] font-semibold bg-status-warning-bg text-status-warning-text px-2 py-0.5 rounded-full">
                          ⚠️ Nearing limit
                        </span>
                      )}
                    </div>

                    <div className="flex justify-between text-[11px] mb-1.5">
                      <div>
                        <p className="text-text-secondary mb-0.5">Balance</p>
                        <p className="font-semibold text-text-primary">
                          {typeof customer.currentBalance === "number"
                            ? formatCurrency(
                                customer.currentBalance,
                                currencySymbol,
                                currencyPosition,
                              )
                            : formatCurrency(
                                0,
                                currencySymbol,
                                currencyPosition,
                              )}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-text-secondary mb-0.5">Limit</p>
                        <p className="font-semibold text-text-primary">
                          {typeof customer.creditLimit === "number"
                            ? formatCurrency(
                                customer.creditLimit,
                                currencySymbol,
                                currencyPosition,
                              )
                            : formatCurrency(
                                0,
                                currencySymbol,
                                currencyPosition,
                              )}
                        </p>
                      </div>
                    </div>

                    {customer.creditLimit > 0 && (
                      <div className="mt-1">
                        <div className="w-full bg-background-disabled rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${
                              percentage >= 80
                                ? "bg-error"
                                : percentage >= 60
                                  ? "bg-status-warning"
                                  : "bg-status-success"
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-text-secondary mt-1">
                          {percentage}% of limit used
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Tablet / Desktop detailed cards (original layout) */}
            <div className="hidden sm:block">
              <div className="space-y-3 sm:space-y-4">
                {topCustomers.map((customer) => {
                  const isWarning = customer.status === "warning";
                  const percentage = Math.min(
                    customer.creditPercentage || 0,
                    100,
                  );

                  return (
                    <div
                      key={customer._id}
                      className={`rounded-xl border p-3 sm:p-4 transition-all duration-150 ${
                        isWarning
                          ? "bg-status-warning-bg border-status-warning/30"
                          : "bg-background-subtle border-border-light"
                      }`}
                    >
                      {/* Header row */}
                      <div className="flex flex-col gap-2 mb-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-medium text-text-primary sm:text-base">
                            {customer.name}
                          </p>
                          {customer.phone && (
                            <p className="text-xs text-text-tertiary mt-0.5">
                              {customer.phone}
                            </p>
                          )}
                        </div>
                        {isWarning && (
                          <span className="inline-flex items-center text-[11px] font-semibold bg-status-warning-bg text-status-warning-text px-2 py-1 rounded-full self-start sm:self-auto">
                            ⚠️ Nearing Credit Limit
                          </span>
                        )}
                      </div>

                      {/* Financials row */}
                      <div className="grid grid-cols-2 gap-3 mb-2 text-xs sm:text-sm">
                        <div className="pr-2 border-r border-border-light">
                          <p className="text-[11px] text-text-secondary mb-1">
                            Balance Due
                          </p>
                          <p className="font-semibold text-text-primary">
                            {typeof customer.currentBalance === "number"
                              ? formatCurrency(
                                  customer.currentBalance,
                                  currencySymbol,
                                  currencyPosition,
                                )
                              : formatCurrency(
                                  0,
                                  currencySymbol,
                                  currencyPosition,
                                )}
                          </p>
                        </div>
                        <div className="pl-2">
                          <p className="text-[11px] text-text-secondary mb-1">
                            Credit Limit
                          </p>
                          <p className="font-semibold text-text-primary">
                            {typeof customer.creditLimit === "number"
                              ? formatCurrency(
                                  customer.creditLimit,
                                  currencySymbol,
                                  currencyPosition,
                                )
                              : formatCurrency(
                                  0,
                                  currencySymbol,
                                  currencyPosition,
                                )}
                          </p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      {customer.creditLimit > 0 && (
                        <div className="mt-2">
                          <div className="w-full bg-background-disabled rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${
                                percentage >= 80
                                  ? "bg-error"
                                  : percentage >= 60
                                    ? "bg-status-warning"
                                    : "bg-status-success"
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <p className="text-[11px] text-text-secondary mt-1">
                            {percentage}% of credit limit used
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="py-6 text-center sm:py-8">
            <p className="text-sm text-text-tertiary sm:text-base">
              ✅ No outstanding credits at the moment
            </p>
            <p className="mt-1 text-xs text-text-tertiary sm:text-sm">
              Customers are all within their credit limits.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreditSummaryCard;
