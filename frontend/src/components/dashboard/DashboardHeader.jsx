import React from "react";
import { PageHeader } from "../common";

const DashboardHeader = ({
  dateRange,
  setDateRange,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
  startDate,
  endDate,
  isRangeMode,
}) => {
  return (
    <>
      <PageHeader
        icon="📊"
        title="Dashboard"
        description="Real-time insights into your hardware store operations"
        className="mb-6"
      />
      <div className="p-5 bg-white border border-border-light shadow-md rounded-2xl sm:p-6 lg:p-7">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col items-center gap-3 text-center">
            {/* Date Range Selector */}
            <div className="flex flex-col items-center gap-4">
              {/* Preset Buttons */}
              <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:flex-wrap sm:justify-center sm:w-auto">
                <button
                  onClick={() => setDateRange("today")}
                  className={`px-3 py-2 rounded-xl font-medium text-xs sm:text-sm transition-all border cursor-pointer active:scale-95 ${
                    dateRange === "today"
                      ? "bg-accent text-white border-accent shadow-sm"
                      : "bg-background-subtle text-text-secondary border-border-light hover:bg-background-disabled"
                  }`}
                >
                  📅 Today
                </button>
                <button
                  onClick={() => setDateRange("yesterday")}
                  className={`px-3 py-2 rounded-xl font-medium text-xs sm:text-sm transition-all border cursor-pointer active:scale-95 ${
                    dateRange === "yesterday"
                      ? "bg-status-pending text-white border-status-pending shadow-sm"
                      : "bg-background-subtle text-text-secondary border-border-light hover:bg-background-disabled"
                  }`}
                >
                  📆 Yesterday
                </button>
                <button
                  onClick={() => setDateRange("last7days")}
                  className={`px-3 py-2 rounded-xl font-medium text-xs sm:text-sm transition-all border cursor-pointer active:scale-95 ${
                    dateRange === "last7days"
                      ? "bg-status-pending text-white border-status-pending shadow-sm"
                      : "bg-background-subtle text-text-secondary border-border-light hover:bg-background-disabled"
                  }`}
                >
                  📊 Last 7 Days
                </button>
                <button
                  onClick={() => setDateRange("last30days")}
                  className={`px-3 py-2 rounded-xl font-medium text-xs sm:text-sm transition-all border cursor-pointer active:scale-95 ${
                    dateRange === "last30days"
                      ? "bg-status-pending text-white border-status-pending shadow-sm"
                      : "bg-background-subtle text-text-secondary border-border-light hover:bg-background-disabled"
                  }`}
                >
                  📈 Last 30 Days
                </button>
                <button
                  onClick={() => setDateRange("custom")}
                  className={`col-span-2 sm:col-span-1 px-3 py-2 rounded-xl font-medium text-xs sm:text-sm transition-all border cursor-pointer active:scale-95 ${
                    dateRange === "custom"
                      ? "bg-status-pending text-white border-status-pending shadow-sm"
                      : "bg-background-subtle text-text-secondary border-border-light hover:bg-background-disabled"
                  }`}
                >
                  🗓️ Custom Range
                </button>
              </div>

              {/* Custom Date Inputs */}
              {dateRange === "custom" && (
                <div className="flex flex-col items-stretch gap-3 p-4 border border-border-light bg-background-subtle rounded-xl w-full sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:w-auto">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-text-secondary whitespace-nowrap">
                      From:
                    </label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      max={customEndDate}
                      className="flex-1 px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-status-pending focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-text-secondary whitespace-nowrap">
                      To:
                    </label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      min={customStartDate}
                      max={new Date().toISOString().split("T")[0]}
                      className="flex-1 px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-status-pending focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Active Date Range Display */}
              <div className="px-4 py-2 bg-white border border-border-light rounded-lg shadow-sm">
                <p className="text-sm text-status-pending-text">
                  <span className="font-semibold">Viewing data for:</span>{" "}
                  {isRangeMode ? (
                    <>
                      <span className="font-mono">{startDate}</span>
                      {" to "}
                      <span className="font-mono">{endDate}</span>
                    </>
                  ) : (
                    <span className="font-mono">{startDate}</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
export default DashboardHeader;
