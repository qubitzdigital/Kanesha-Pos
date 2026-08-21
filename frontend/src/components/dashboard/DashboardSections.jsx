import React from "react";
import {
  DailySalesCard,
  LowStockItemsCard,
  CreditSummaryCard,
  SupplierPayablesCard,
  MonthlySalesTrendCard,
  TopCategoriesCard,
  ProfitCardsSection,
  ExpensesSummaryCard,
} from "./index";

const DashboardSections = ({
  dailySalesOverview,
  profitMetrics,
  expensesSummary,
  lowStockItems,
  creditSummary,
  supplierPayables,
  monthlySalesTrend,
  topCategoriesData,
  loading,
  currencySymbol = "Rs.",
  currencyPosition = "before",
}) => {
  return (
    <>
      {/* Real-Time Daily Sales Overview with Net Profit */}
      <section>
        <DailySalesCard
          invoiceCount={dailySalesOverview?.invoiceCount}
          totalSales={dailySalesOverview?.totalSalesAmount}
          grossProfit={dailySalesOverview?.grossProfit}
          netProfit={profitMetrics?.today?.netProfit}
          totalExpenses={profitMetrics?.today?.totalExpenses}
          totalVAT={dailySalesOverview?.totalVAT}
          paymentBreakdown={dailySalesOverview?.paymentBreakdown}
          currencySymbol={currencySymbol}
          currencyPosition={currencyPosition}
        />
      </section>

      {/* Expenses Summary - Below Real-Time Sales */}
      <section>
        <ExpensesSummaryCard
          totalExpenses={expensesSummary?.totalExpenses}
          expenseCount={expensesSummary?.expenseCount}
          categoryBreakdown={expensesSummary?.categoryBreakdown}
          loading={loading}
          currencySymbol={currencySymbol}
          currencyPosition={currencyPosition}
        />
      </section>

      {/* Profit Cards Section - High Visibility */}
      <section>
        <ProfitCardsSection
          todayMetrics={profitMetrics?.today}
          monthMetrics={profitMetrics?.month}
          loading={loading}
          currencySymbol={currencySymbol}
          currencyPosition={currencyPosition}
        />
      </section>

      {/* Metrics Grid - Top Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Critical Items */}
        <section>
          <LowStockItemsCard items={lowStockItems} loading={loading} />
        </section>

        {/* Outstanding Customer Credit Summary */}
        <section>
          <CreditSummaryCard
            totalCreditGiven={creditSummary?.totalCreditGiven}
            topCustomers={creditSummary?.topCustomers}
            warningCount={creditSummary?.warningCount}
            loading={loading}
            currencySymbol={currencySymbol}
            currencyPosition={currencyPosition}
          />
        </section>
      </div>

      {/* Supplier Payables - Full Width */}
      <section>
        <SupplierPayablesCard
          totalOutstanding={supplierPayables?.totalOutstanding}
          supplierPayables={supplierPayables?.supplierPayables}
          loading={loading}
          currencySymbol={currencySymbol}
          currencyPosition={currencyPosition}
        />
      </section>

      {/* Monthly Sales Trend - Full Width */}
      <section>
        <MonthlySalesTrendCard
          trendDaily={monthlySalesTrend.daily}
          trendMonthly={monthlySalesTrend.monthly}
          loading={loading}
          currencySymbol={currencySymbol}
          currencyPosition={currencyPosition}
        />
      </section>

      {/* Top Selling Categories */}
      <section>
        <TopCategoriesCard
          topCategoriesToday={topCategoriesData.today}
          topCategoriesMonth={topCategoriesData.month}
          loading={loading}
        />
      </section>
    </>
  );
};

export default DashboardSections;
