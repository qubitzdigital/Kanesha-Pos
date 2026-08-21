import React, { useState, useEffect, useCallback } from "react";
import PageHeader from "../components/common/PageHeader";
import AppLoader from "../components/common/AppLoader";
import {
  getDailySalesOverview,
  getProfitMetrics,
  getExpensesSummary,
} from "../api/dashboard/dashboard";
import { getSales } from "../api/sales/sales";
import { getExpenses } from "../api/expenses/expenses";
import { loadCurrencySettings } from "../api/settings/settings";

// Import new report components
import DateRangeSelector from "../components/report/DateRangeSelector";
import ExportButtons from "../components/report/ExportButtons";
import ReportSkeleton from "../components/report/ReportSkeleton";
import SummaryMetrics from "../components/report/SummaryMetrics";
import DailyBreakdownTable from "../components/report/DailyBreakdownTable";
import ReportModal from "../components/report/ReportModal";

// Import export utilities
import {
  exportToCSV,
  exportToPDF,
  exportModalData,
  exportModalDataAsPDF,
} from "../utils/reportExports";

const ReportsPage = ({ api }) => {
  // Date range states
  const [dateRange, setDateRange] = useState("today");
  const [customStartDate, setCustomStartDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [customEndDate, setCustomEndDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [dateRangeError, setDateRangeError] = useState(null);

  // Report data states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [dailyBreakdown, setDailyBreakdown] = useState([]);
  const [breakdownError, setBreakdownError] = useState(null);

  // Currency settings
  const [currencySymbol, setCurrencySymbol] = useState("Rs.");
  const [currencyPosition, setCurrencyPosition] = useState("before");

  // Modal states
  const [activeModal, setActiveModal] = useState(null);
  const [modalData, setModalData] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Load currency settings on mount
  useEffect(() => {
    const initCurrency = async () => {
      try {
        const settings = await loadCurrencySettings(api);
        setCurrencySymbol(settings.currencySymbol);
        setCurrencyPosition(settings.currencyPosition);
      } catch (error) {
        console.error("Failed to load currency settings:", error);
      }
    };
    initCurrency();
  }, [api]);

  // Format date in local timezone (YYYY-MM-DD)
  const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Calculate date range based on selection (pure - no setState calls)
  const getDateRangeParams = useCallback(() => {
    const today = new Date();
    let startDate, endDate;

    switch (dateRange) {
      case "today":
        startDate = endDate = formatLocalDate(today);
        break;
      case "yesterday": {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        startDate = endDate = formatLocalDate(yesterday);
        break;
      }
      case "last7days": {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 6);
        startDate = formatLocalDate(weekAgo);
        endDate = formatLocalDate(today);
        break;
      }
      case "last30days": {
        const monthAgo = new Date(today);
        monthAgo.setDate(monthAgo.getDate() - 29);
        startDate = formatLocalDate(monthAgo);
        endDate = formatLocalDate(today);
        break;
      }
      case "custom": {
        startDate = customStartDate;
        endDate = customEndDate;
        break;
      }
      default:
        startDate = endDate = formatLocalDate(today);
    }

    return { startDate, endDate };
  }, [dateRange, customStartDate, customEndDate]);

  // Generate daily breakdown data
  const generateDailyBreakdown = useCallback(
    async (startDate, endDate) => {
      try {
        setBreakdownError(null);
        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = [];

        let currentDate = new Date(start);
        while (currentDate <= end) {
          const year = currentDate.getFullYear();
          const month = String(currentDate.getMonth() + 1).padStart(2, "0");
          const day = String(currentDate.getDate()).padStart(2, "0");
          days.push(`${year}-${month}-${day}`);
          currentDate = new Date(currentDate);
          currentDate.setDate(currentDate.getDate() + 1);
        }

        const dayDataPromises = days.map((date) =>
          Promise.all([
            getDailySalesOverview(api, date, date),
            getProfitMetrics(api, date, date),
            getExpensesSummary(api, date, date),
          ]),
        );

        const allDayData = await Promise.all(dayDataPromises);

        return days.map((date, idx) => {
          const [sales, profit, expenses] = allDayData[idx];
          return {
            date,
            totalSales: sales?.totalSalesAmount || 0,
            invoiceCount: sales?.invoiceCount || 0,
            totalVAT: sales?.totalVAT || 0,
            grossProfit: profit?.today?.grossProfit || 0,
            netProfit: profit?.today?.netProfit || 0,
            totalExpenses: expenses?.totalExpenses || 0,
          };
        });
      } catch (err) {
        console.error("Error generating daily breakdown:", err);
        setBreakdownError(
          "Failed to load daily breakdown data. Showing summary only.",
        );
        return [];
      }
    },
    [api],
  );

  // Load report data
  const loadReportData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { startDate, endDate } = getDateRangeParams();

      // Validate 90-day max for custom range
      if (dateRange === "custom") {
        const daysDiff = Math.floor(
          (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24),
        );
        if (daysDiff > 90) {
          setDateRangeError("Date range cannot exceed 90 days");
          setLoading(false);
          return;
        }
        setDateRangeError(null);
      }
      const isSingleDay = startDate === endDate;
      const isRangeMode = !["today", "yesterday"].includes(dateRange);

      const [sales, profit, expenses] = await Promise.all([
        getDailySalesOverview(api, startDate, endDate),
        getProfitMetrics(api, startDate, endDate),
        getExpensesSummary(api, startDate, endDate),
      ]);

      setReportData({
        startDate,
        endDate,
        isSingleDay,
        isRangeMode,
        totalSales: sales?.totalSalesAmount || 0,
        invoiceCount: sales?.invoiceCount || 0,
        totalVAT: sales?.totalVAT || 0,
        grossProfit: profit?.today?.grossProfit || 0,
        netProfit: profit?.today?.netProfit || 0,
        totalExpenses: expenses?.totalExpenses || 0,
        paymentBreakdown: sales?.paymentBreakdown || {},
      });

      if (isRangeMode) {
        const breakdown = await generateDailyBreakdown(startDate, endDate);
        setDailyBreakdown(breakdown);
      } else {
        setDailyBreakdown([]);
      }

      setLoading(false);
    } catch (err) {
      console.error("Error loading report:", err);
      setError("Failed to load report data. Please try again.");
      setLoading(false);
    }
  }, [api, dateRange, getDateRangeParams, generateDailyBreakdown]);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  // Fetch detailed sales data for modal
  const fetchSalesDetails = useCallback(async () => {
    setModalLoading(true);
    try {
      const dateParams = getDateRangeParams();
      if (!dateParams) return;
      const { startDate, endDate } = dateParams;
      const response = await getSales(api, { startDate, endDate, limit: 1000 });
      const sales = response.sales || [];

      setModalData(sales);
    } catch (err) {
      console.error("Error fetching sales details:", err);
      setModalData([]);
    }
    setModalLoading(false);
  }, [api, getDateRangeParams]);

  // Fetch detailed expenses data for modal
  const fetchExpensesDetails = useCallback(async () => {
    setModalLoading(true);
    try {
      const dateParams = getDateRangeParams();
      if (!dateParams) return;
      const { startDate, endDate } = dateParams;
      const response = await getExpenses(api, { startDate, endDate });
      const expenses = response.expenses || [];

      setModalData(expenses);
    } catch (err) {
      console.error("Error fetching expenses details:", err);
      setModalData([]);
    }
    setModalLoading(false);
  }, [api, getDateRangeParams]);

  // Fetch profit breakdown
  const fetchProfitDetails = useCallback(async () => {
    setModalLoading(true);
    try {
      // For profit breakdown, we don't need to fetch additional data
      // We'll use the reportData that's already loaded
      setModalData(reportData);
    } catch (err) {
      console.error("Error fetching profit details:", err);
      setModalData(null);
    }
    setModalLoading(false);
  }, [reportData]);

  // Open modal handler
  const openModal = useCallback(
    (type) => {
      setActiveModal(type);
      setModalData(null);
      setSearchTerm("");

      if (type === "sales") fetchSalesDetails();
      else if (type === "expenses") fetchExpensesDetails();
      else if (type === "profit") fetchProfitDetails();
    },
    [fetchSalesDetails, fetchExpensesDetails, fetchProfitDetails],
  );

  // Close modal
  const closeModal = () => {
    setActiveModal(null);
    setModalData(null);
    setSearchTerm("");
  };

  // Handle export CSV with date range
  const handleExportCSV = () => {
    const dateRangeStr = `${reportData.startDate}_to_${reportData.endDate}`;
    exportToCSV(
      reportData,
      dailyBreakdown,
      dateRangeStr,
      currencySymbol,
      currencyPosition,
    );
  };

  // Handle export PDF with date range
  const handleExportPDF = () => {
    const dateRangeStr = `${reportData.startDate} to ${reportData.endDate}`;
    exportToPDF(
      reportData,
      dailyBreakdown,
      dateRangeStr,
      currencySymbol,
      currencyPosition,
    );
  };

  // Handle modal CSV export
  const handleModalExportCSV = () => {
    const dateRangeStr = `${reportData.startDate}_to_${reportData.endDate}`;
    exportModalData(
      activeModal,
      modalData,
      dateRangeStr,
      currencySymbol,
      currencyPosition,
    );
  };

  // Handle modal PDF export
  const handleModalExportPDF = () => {
    const dateRangeStr = `${reportData.startDate} to ${reportData.endDate}`;
    exportModalDataAsPDF(
      activeModal,
      modalData,
      dateRangeStr,
      reportData,
      currencySymbol,
      currencyPosition,
    );
  };

  // Error state
  if (!api) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4 py-6 bg-gray-50">
        <div className="p-6 text-center bg-white border border-red-200 shadow-md rounded-2xl">
          <p className="text-lg font-semibold text-red-600">Configuration Error</p>
          <p className="mt-2 text-sm text-gray-600">API client not initialized</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4 py-6 bg-gray-50 sm:px-6 lg:px-8">
        <div className="w-full max-w-md p-6 bg-white border border-red-200 shadow-md rounded-2xl sm:p-7">
          <div className="flex items-start gap-3 mb-3">
            <div className="flex items-center justify-center rounded-full w-9 h-9 bg-red-50">
              <span className="text-lg text-red-600">!</span>
            </div>
            <div>
              <p className="text-base font-semibold text-red-800">Error</p>
              <p className="mt-1 text-sm text-gray-600">{error}</p>
            </div>
          </div>
          <button
            onClick={loadReportData}
            className="mt-4 inline-flex items-center justify-center px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium text-sm hover:bg-red-700 active:scale-95 transition-all shadow-sm hover:shadow-md cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { startDate, endDate } = getDateRangeParams();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
        <div className="pb-10 mx-auto space-y-6 max-w-7xl">
          {/* Page Header */}
          <PageHeader
            icon="📊"
            title="Reports"
            description="Detailed financial and sales reports with date range filtering"
          />

          {/* Date Range Selector Component */}
          <DateRangeSelector
            dateRange={dateRange}
            customStartDate={customStartDate}
            customEndDate={customEndDate}
            dateRangeError={dateRangeError}
            activeStartDate={startDate}
            activeEndDate={endDate}
            isSingleDay={reportData?.isSingleDay}
            onDateRangeChange={setDateRange}
            onCustomStartDateChange={setCustomStartDate}
            onCustomEndDateChange={setCustomEndDate}
          />

          {/* Export Buttons Component */}
          {reportData && (
            <ExportButtons
              onExportCSV={handleExportCSV}
              onExportPDF={handleExportPDF}
            />
          )}
          
          {/* AppLoader - Shows beneath PageHeader during initial load */}
          {loading && (
            <AppLoader
              open
              variant="inline"
              title="Loading report"
              subtitle="Fetching your financial data"
              tone="primary"
            />
          )}

          {/* Loading State */}
          {loading ? (
            <ReportSkeleton
              isRangeMode={dateRange !== "today" && dateRange !== "yesterday"}
            />
          ) : reportData ? (
            <>
              {/* Summary Metrics Component */}
              <SummaryMetrics
                reportData={reportData}
                onCardClick={openModal}
                currencySymbol={currencySymbol}
                currencyPosition={currencyPosition}
              />

              {/* Daily Breakdown Table Component */}
              <DailyBreakdownTable
                dailyBreakdown={dailyBreakdown}
                breakdownError={breakdownError}
                isRangeMode={reportData.isRangeMode}
                currencySymbol={currencySymbol}
                currencyPosition={currencyPosition}
              />
            </>
          ) : null}
        </div>
      </div>

      {/* Report Modal Component */}
      <ReportModal
        activeModal={activeModal}
        modalData={modalData}
        modalLoading={modalLoading}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onClose={closeModal}
        onExportCSV={handleModalExportCSV}
        onExportPDF={handleModalExportPDF}
        reportData={reportData}
        currencySymbol={currencySymbol}
        currencyPosition={currencyPosition}
      />
    </div>
  );
};

export default ReportsPage;
