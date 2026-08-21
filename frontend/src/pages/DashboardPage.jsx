import React, { useState, useEffect, useCallback } from "react";
import {
  DashboardHeader,
  LoadingState,
  ErrorDisplay,
  QuickSummarySection,
  DashboardSections,
} from "../components/dashboard/index";

import {
  getDailySalesOverview,
  getLowStockItems,
  getOutstandingCredits,
  getSupplierPayables,
  getMonthlySalesTrend,
  getTopCategories,
  getProfitMetrics,
  getExpensesSummary,
} from "../api/dashboard/dashboard";
import { loadCurrencySettings } from "../api/settings/settings";

const DashboardPage = ({ api }) => {
  // Date range state
  const [dateRange, setDateRange] = useState("today");
  const [customStartDate, setCustomStartDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [customEndDate, setCustomEndDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  // State for all dashboard data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Feature data states
  const [dailySalesOverview, setDailySalesOverview] = useState(null);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [creditSummary, setCreditSummary] = useState(null);
  const [supplierPayables, setSupplierPayables] = useState(null);
  const [monthlySalesTrend, setMonthlySalesTrend] = useState({
    daily: [],
    monthly: [],
  });
  const [topCategoriesData, setTopCategoriesData] = useState({
    today: [],
    month: [],
  });
  const [profitMetrics, setProfitMetrics] = useState(null);
  const [expensesSummary, setExpensesSummary] = useState(null);
  const [currencySymbol, setCurrencySymbol] = useState("Rs.");
  const [currencyPosition, setCurrencyPosition] = useState("before");

  // Calculate date range based on selection
  const getDateRangeParams = useCallback(() => {
    const today = new Date();
    let startDate, endDate;

    switch (dateRange) {
      case "today":
        startDate = endDate = new Date().toISOString().split("T")[0];
        break;
      case "yesterday":
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        startDate = endDate = yesterday.toISOString().split("T")[0];
        break;
      case "last7days":
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 6); // inclusive of today -> 7 days total
        startDate = weekAgo.toISOString().split("T")[0];
        endDate = new Date().toISOString().split("T")[0];
        break;
      case "last30days":
        const monthAgo = new Date(today);
        monthAgo.setDate(monthAgo.getDate() - 29); // inclusive of today -> 30 days total
        startDate = monthAgo.toISOString().split("T")[0];
        endDate = new Date().toISOString().split("T")[0];
        break;
      case "custom":
        startDate = customStartDate;
        endDate = customEndDate;
        break;
      default:
        startDate = endDate = new Date().toISOString().split("T")[0];
    }

    return { startDate, endDate };
  }, [dateRange, customStartDate, customEndDate]);

  // Load all dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { startDate, endDate } = getDateRangeParams();

      // Fetch all data in parallel for better performance
      const [
        dailySales,
        lowStock,
        credits,
        payables,
        dailyTrend,
        monthlyTrend,
        catToday,
        catMonth,
        profit,
        expenses,
      ] = await Promise.all([
        getDailySalesOverview(api, startDate, endDate),
        getLowStockItems(api),
        getOutstandingCredits(api),
        getSupplierPayables(api),
        getMonthlySalesTrend(api, { range: "days", days: 30 }),
        getMonthlySalesTrend(api, { range: "months", months: 12 }),
        getTopCategories(api, "today", startDate, endDate),
        getTopCategories(api, "month", startDate, endDate),
        getProfitMetrics(api, startDate, endDate),
        getExpensesSummary(api, startDate, endDate),
      ]);

      // Update states
      setDailySalesOverview(dailySales);
      setLowStockItems(lowStock.lowStockItems || []);
      setCreditSummary(credits);
      setSupplierPayables(payables);
      setMonthlySalesTrend({
        daily: dailyTrend.trendData || [],
        monthly: monthlyTrend.trendData || [],
      });
      setTopCategoriesData({
        today: catToday.topCategories || [],
        month: catMonth.topCategories || [],
      });
      setProfitMetrics(profit);
      setExpensesSummary(expenses);

      setLoading(false);
    } catch (err) {
      console.error("Error loading dashboard:", err);
      setError("Failed to load dashboard data. Please try again.");
      setLoading(false);
    }
  }, [getDateRangeParams]);

  // Initial load and reload on date change
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Auto-refresh every 30s to reflect processed returns without a page reload
  useEffect(() => {
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, [loadDashboardData]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await loadCurrencySettings(api);
        setCurrencySymbol(settings.currencySymbol || "Rs.");
        setCurrencyPosition(settings.currencyPosition || "before");
      } catch (error) {
        // Use defaults if error
      }
    };
    loadSettings();
  }, [api]);

  if (error) {
    return <ErrorDisplay error={error} onRetry={loadDashboardData} />;
  }

  const { startDate, endDate } = getDateRangeParams();
  const isRangeMode = startDate !== endDate;

  return (
    <div className="min-h-screen">
      <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
        <div className="pb-10 mx-auto space-y-6 max-w-7xl">
          {/* Page Header with Date Filters */}
          <DashboardHeader
            dateRange={dateRange}
            setDateRange={setDateRange}
            customStartDate={customStartDate}
            setCustomStartDate={setCustomStartDate}
            customEndDate={customEndDate}
            setCustomEndDate={setCustomEndDate}
            startDate={startDate}
            endDate={endDate}
            isRangeMode={isRangeMode}
          />

          {loading && !dailySalesOverview ? (
            <LoadingState />
          ) : (
            <>
              <DashboardSections
                dailySalesOverview={dailySalesOverview}
                profitMetrics={profitMetrics}
                expensesSummary={expensesSummary}
                lowStockItems={lowStockItems}
                creditSummary={creditSummary}
                supplierPayables={supplierPayables}
                monthlySalesTrend={monthlySalesTrend}
                topCategoriesData={topCategoriesData}
                loading={loading}
                currencySymbol={currencySymbol}
                currencyPosition={currencyPosition}
              />

              <QuickSummarySection
                dailySalesOverview={dailySalesOverview}
                creditSummary={creditSummary}
                supplierPayables={supplierPayables}
                startDate={startDate}
                endDate={endDate}
                isRangeMode={isRangeMode}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
