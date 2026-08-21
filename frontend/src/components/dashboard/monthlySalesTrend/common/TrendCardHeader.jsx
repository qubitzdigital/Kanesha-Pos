import React from "react";

const TrendCardHeader = ({ range, onRangeChange }) => {
  return (
    <div className="flex flex-col gap-3 mb-5 sm:flex-row sm:items-center sm:justify-between sm:mb-6">
      <div className="space-y-1">
        <h3 className="text-lg sm:text-xl font-semibold text-accent/90 flex items-center gap-1.5">
          <span className="text-xl">📈</span>
          <span>Sales Trend</span>
        </h3>
        <p className="text-xs text-text-secondary sm:text-sm">
          View sales and invoice trends for the last 7 days, 30 days, or
          monthly.
        </p>
      </div>

      <div className="inline-flex flex-wrap gap-2 p-1 rounded-xl">
        <button
          onClick={() => onRangeChange("7d")}
          className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all border cursor-pointer ${
            range === "7d"
              ? "bg-accent text-white border-accent shadow-sm"
              : "bg-background-subtle text-text-secondary border-border-light hover:bg-background-disabled"
          } active:scale-95`}
        >
          Last 7 days
        </button>
        <button
          onClick={() => onRangeChange("30d")}
          className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all border cursor-pointer ${
            range === "30d"
              ? "bg-accent text-white border-accent shadow-sm"
              : "bg-background-subtle text-text-secondary border-border-light hover:bg-background-disabled"
          } active:scale-95`}
        >
          Last 30 days
        </button>
        <button
          onClick={() => onRangeChange("month")}
          className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all border cursor-pointer ${
            range === "month"
              ? "bg-accent text-white border-accent shadow-sm"
              : "bg-background-subtle text-text-secondary border-border-light hover:bg-background-disabled"
          } active:scale-95`}
        >
          Monthly (12m)
        </button>
      </div>
    </div>
  );
};

export default TrendCardHeader;
