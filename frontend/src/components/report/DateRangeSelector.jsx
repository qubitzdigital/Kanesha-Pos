import React from "react";

const DateRangeSelector = ({
  dateRange,
  onDateRangeChange: setDateRange,
  customStartDate,
  onCustomStartDateChange: setCustomStartDate,
  customEndDate,
  onCustomEndDateChange: setCustomEndDate,
  dateRangeError,
  activeStartDate: startDate,
  activeEndDate: endDate,
  isSingleDay,
}) => {
  return (
    <div className="p-5 bg-white border border-gray-200 shadow-md rounded-2xl sm:p-6 lg:p-7">
      <div className="space-y-5">
        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setDateRange("today")}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-all border cursor-pointer active:scale-95 ${
                dateRange === "today"
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
              }`}
            >
              📅 Today
            </button>
            <button
              onClick={() => setDateRange("yesterday")}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-all border cursor-pointer active:scale-95 ${
                dateRange === "yesterday"
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
              }`}
            >
              📆 Yesterday
            </button>
            <button
              onClick={() => setDateRange("last7days")}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-all border cursor-pointer active:scale-95 ${
                dateRange === "last7days"
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
              }`}
            >
              📊 Last 7 Days
            </button>
            <button
              onClick={() => setDateRange("last30days")}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-all border cursor-pointer active:scale-95 ${
                dateRange === "last30days"
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
              }`}
            >
              📈 Last 30 Days
            </button>
            <button
              onClick={() => setDateRange("custom")}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-all border cursor-pointer active:scale-95 ${
                dateRange === "custom"
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
              }`}
            >
              🗓️ Custom Range
            </button>
          </div>

          {/* Custom Date Inputs */}
          {dateRange === "custom" && (
            <div className="flex flex-wrap items-center justify-center gap-3 p-4 border border-gray-200 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">
                  From:
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  max={customEndDate}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">To:</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  min={customStartDate}
                  max={new Date().toISOString().split("T")[0]}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Date Range Error */}
          {dateRangeError && (
            <div className="px-4 py-2 border border-red-200 rounded-lg bg-red-50">
              <p className="text-sm text-red-700">
                <span className="font-semibold">⚠️ {dateRangeError}</span>
              </p>
            </div>
          )}

          {/* Active Date Range Display */}
          <div className="px-4 py-2 border border-blue-200 rounded-lg bg-blue-50">
            <p className="text-sm text-blue-900">
              <span className="font-semibold">Report for:</span>{" "}
              {isSingleDay ? (
                <span className="font-mono">{startDate}</span>
              ) : (
                <>
                  <span className="font-mono">{startDate}</span>
                  {" to "}
                  <span className="font-mono">{endDate}</span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateRangeSelector;
