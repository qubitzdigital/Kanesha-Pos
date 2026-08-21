import React from "react";
import AppLoader from "../common/AppLoader";

/**
 * Low Stock Items Component
 * Displays items below low stock level with auto color coding
 *
 * NOTE: Logic is unchanged. Only styling and layout have been enhanced.
 */
const LowStockItemsCard = ({ items, loading = false }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "red":
        return "bg-error-subtle border-error/30";
      case "orange":
        return "bg-status-warning-bg border-status-warning/30";
      default:
        return "bg-background-subtle border-border-light";
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "red":
        return "bg-error-subtle text-error-hover";
      case "orange":
        return "bg-status-warning-bg text-status-warning-text";
      default:
        return "bg-background-subtle text-text-primary";
    }
  };

  const hasItems = items && items.length > 0;

  return (
    <div className="w-full p-5 bg-white border border-border-light shadow-md rounded-2xl sm:p-6 lg:p-7">
      {/* Header */}
      <div className="flex flex-col gap-3 mb-5 sm:flex-row sm:items-center sm:justify-between sm:mb-6">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold sm:text-xl text-accent/90">
            <span className="text-xl">🚨</span>
            <span>Low Stock Critical Items</span>
          </h3>
          <p className="mt-1 text-xs text-text-secondary sm:text-sm">
            Keep an eye on critical and low-stock items before they run out.
          </p>
        </div>
        {hasItems && (
          <div className="flex flex-col items-start sm:items-end">
            <span className="text-base font-semibold text-text-primary sm:text-lg">
              {items.length} item{items.length > 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <AppLoader
            open
            variant="inline"
            title="Checking stock levels"
            subtitle="Reviewing critical inventory"
          />
        </div>
      ) : hasItems ? (
        <div className="space-y-3 sm:space-y-4">
          {items.map((item) => (
            <div
              key={item._id}
              className={`border rounded-xl px-4 py-3 sm:px-5 sm:py-4 ${getStatusColor(
                item.status,
              )} transform transition-all duration-150 hover:shadow-sm hover:-translate-y-0.5 cursor-default`}
            >
              {/* Item header row */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2.5">
                <div className="min-w-0">
                  <h4 className="text-sm font-medium text-text-primary break-words sm:text-base">
                    {item.sku}
                  </h4>
                  {item.code && (
                    <p className="text-[11px] text-text-secondary mt-0.5 break-words">
                      {item.code}
                    </p>
                  )}
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold ${getStatusBadgeColor(
                    item.status,
                  )}`}
                >
                  {item.statusMessage}
                </span>
              </div>

              {/* Stock info – desktop/tablet (table-like grid) */}
              <div className="hidden grid-cols-2 gap-3 mb-2 text-xs sm:grid sm:text-sm">
                <div className="pr-2 border-r border-border-light">
                  <p className="text-[11px] text-text-secondary mb-1">
                    Current Stock
                  </p>
                  <p className="font-semibold text-text-primary">
                    {item.currentStock}
                  </p>
                </div>
                <div className="pl-2">
                  <p className="text-[11px] text-text-secondary mb-1">
                    Low Stock Level
                  </p>
                  <p className="font-semibold text-text-primary">
                    {item.lowStockLevel}
                  </p>
                </div>
              </div>

              {/* Stock info – mobile-friendly stacked layout */}
              <div className="grid grid-cols-1 gap-2 mb-2 text-xs sm:hidden">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-text-secondary">
                    Current Stock
                  </p>
                  <p className="font-semibold text-text-primary">
                    {item.currentStock}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-text-secondary">
                    Low Stock Level
                  </p>
                  <p className="font-semibold text-text-primary">
                    {item.lowStockLevel}
                  </p>
                </div>
              </div>

              {/* Stock Percentage Bar */}
              <div className="mt-2">
                <div className="w-full h-2 overflow-hidden bg-background-disabled rounded-full">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      item.status === "red"
                        ? "bg-error"
                        : item.status === "orange"
                          ? "bg-status-warning"
                          : "bg-status-success"
                    }`}
                    style={{
                      width: `${Math.min(item.stockPercentage, 100)}%`,
                    }}
                  />
                </div>
                <p className="text-[11px] sm:text-xs text-text-secondary mt-1">
                  {item.stockPercentage}% of low stock level
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-7 sm:py-8">
          <p className="text-sm text-text-tertiary sm:text-base">
            ✅ All items are well stocked
          </p>
          <p className="mt-1 text-xs text-text-tertiary sm:text-sm">
            No items are currently below the configured low stock levels.
          </p>
        </div>
      )}
    </div>
  );
};

export default LowStockItemsCard;
