import React, { useState } from "react";
import AppLoader from "../common/AppLoader";

/**
 * Top Categories Component
 * Shows best-selling categories and demand patterns
 *
 * NOTE: Logic is unchanged. Only styling and layout have been enhanced.
 */
const TopCategoriesCard = ({
  topCategoriesToday,
  topCategoriesMonth,
  loading = false,
}) => {
  const [view, setView] = useState("today"); // 'today' or 'month'

  const categories = view === "today" ? topCategoriesToday : topCategoriesMonth;

  if (!categories || categories.length === 0) {
    return null;
  }

  const maxAmount = Math.max(...categories.map((c) => c.totalAmount), 1);

  return (
    <div className="bg-white border border-border-light rounded-2xl shadow-md p-5 sm:p-6 lg:p-7 w-full">
      {/* Header & Toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-5">
        <div>
          <h3 className="text-lg sm:text-xl font-semibold text-text-primary flex items-center gap-2">
            <span className="text-xl">🏆</span>
            <span>Top Selling Categories</span>
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-text-secondary">
            See which product categories are driving your sales today or this
            month.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 bg-background-subtle rounded-full p-1">
          <button
            onClick={() => setView("today")}
            className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all border cursor-pointer ${
              view === "today"
                ? "bg-status-pending text-white border-status-pending shadow-sm"
                : "bg-background-subtle text-text-secondary border-border-light hover:bg-background-disabled"
            } active:scale-95`}
          >
            Today
          </button>
          <button
            onClick={() => setView("month")}
            className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all border cursor-pointer ${
              view === "month"
                ? "bg-status-pending text-white border-status-pending shadow-sm"
                : "bg-background-subtle text-text-secondary border-border-light hover:bg-background-disabled"
            } active:scale-95`}
          >
            This Month
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <AppLoader
            open
            variant="inline"
            title="Loading top categories"
            subtitle="Reviewing category performance"
          />
        </div>
      ) : (
        <>
          {/* Desktop / Large Tablet View (original layout) */}
          <div className="hidden md:block">
            <div className="space-y-3 sm:space-y-4">
              {categories.map((category, idx) => {
                const percentage = (category.totalAmount / maxAmount) * 100;
                return (
                  <div
                    key={idx}
                    className="space-y-2 rounded-xl border border-border-light p-3 sm:p-4 hover:shadow-sm transition-shadow duration-150"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 flex items-center justify-center rounded-full border border-status-pending text-xs font-semibold text-status-pending">
                          {idx + 1}
                        </div>
                        <div>
                          <h4 className="font-medium text-text-primary text-sm sm:text-base">
                            {category.category}
                          </h4>
                          <p className="text-xs text-text-secondary mt-0.5">
                            {category.invoiceCount} invoice
                            {category.invoiceCount !== 1 ? "s" : ""} •{" "}
                            {category.totalQty} unit
                            {category.totalQty !== 1 ? "s" : ""} sold
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-text-primary text-sm sm:text-base whitespace-nowrap">
                        LKR{" "}
                        {category.totalAmount.toLocaleString("en-US", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </span>
                    </div>

                    <div className="w-full bg-background-disabled rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile / Small Tablet View (more compact, touch-friendly layout) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {categories.map((category, idx) => {
              const percentage = (category.totalAmount / maxAmount) * 100;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-border-light p-3 hover:shadow-sm transition-shadow duration-150"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-start gap-2">
                      <div className="w-7 h-7 flex items-center justify-center rounded-full border border-status-pending text-xs font-semibold text-status-pending flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="font-medium text-text-primary text-sm">
                          {category.category}
                        </h4>
                        <p className="text-[11px] text-text-secondary mt-0.5">
                          {category.invoiceCount} invoice
                          {category.invoiceCount !== 1 ? "s" : ""} •{" "}
                          {category.totalQty} unit
                          {category.totalQty !== 1 ? "s" : ""} sold
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-text-primary text-sm whitespace-nowrap">
                      LKR{" "}
                      {category.totalAmount.toLocaleString("en-US", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  </div>

                  <div className="w-full bg-background-disabled rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default TopCategoriesCard;
