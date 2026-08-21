import React, { useMemo, useState } from "react";
import TrendCardHeader from "./common/TrendCardHeader";
import TrendLineChart from "./TrendLineChart";
import TrendDataTable from "./TrendDataTable";
import TrendLoadingState from "./TrendLoadingState";
import TrendEmptyState from "./TrendEmptyState";

/**
 * Monthly Sales Trend Component
 * - Line charts (no area / bar feel)
 * - Clear X/Y axis values
 * - Same logic (range filter), but visuals simplified & clarified
 */
const MonthlySalesTrendCard = ({
  trendDaily = [],
  trendMonthly = [],
  loading = false,
  currencySymbol = "Rs.",
  currencyPosition = "before",
}) => {
  // If there is absolutely no data at all, don't render the card
  if (
    (!trendDaily || trendDaily.length === 0) &&
    (!trendMonthly || trendMonthly.length === 0)
  ) {
    return null;
  }

  const [range, setRange] = useState("30d"); // "7d" | "30d" | "month"

  // Filtered data based on selected range
  const filteredData = useMemo(() => {
    if (range === "month") return trendMonthly || [];
    const source = trendDaily || [];
    if (source.length === 0) return [];
    if (range === "7d") return source.slice(-7);
    return source.slice(-30);
  }, [range, trendDaily, trendMonthly]);

  // Helper to safely get max value
  const getMax = (arr, key) => {
    if (!arr || arr.length === 0) return 1;
    const vals = arr.map((d) => Number(d[key] || 0));
    const max = Math.max(...vals);
    return max > 0 ? max : 1;
  };

  const maxSales = getMax(filteredData, "totalSales");
  const maxInvoices = getMax(filteredData, "invoiceCount");
  const hasDataForRange = filteredData && filteredData.length > 0;

  return (
    <div className="w-full p-5 bg-white border border-border-light shadow-md rounded-2xl sm:p-6 lg:p-7">
      <TrendCardHeader range={range} onRangeChange={setRange} />

      {loading ? (
        <TrendLoadingState />
      ) : !hasDataForRange ? (
        <TrendEmptyState />
      ) : (
        <div className="space-y-6">
          <TrendLineChart
            data={filteredData}
            maxValue={maxSales}
            valueKey="totalSales"
            title="Sales Amount"
            subtitle={`Y-axis: ${currencySymbol} (sales), X-axis: date/month`}
            color="#22c55e" // Tailwind green-500
            height={220}
            range={range}
            currencySymbol={currencySymbol}
            currencyPosition={currencyPosition}
          />

          <TrendLineChart
            data={filteredData}
            maxValue={maxInvoices}
            valueKey="invoiceCount"
            title="Invoice Count"
            subtitle="Y-axis: number of invoices, X-axis: date/month"
            color="#6366f1" // Tailwind indigo-500
            height={160}
            range={range}
            currencySymbol={currencySymbol}
            currencyPosition={currencyPosition}
          />

          <TrendDataTable
            data={filteredData}
            currencySymbol={currencySymbol}
            currencyPosition={currencyPosition}
          />
        </div>
      )}
    </div>
  );
};

export default MonthlySalesTrendCard;
