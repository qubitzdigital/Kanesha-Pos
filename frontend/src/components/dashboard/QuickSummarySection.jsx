import React from "react";

const QuickSummarySection = ({
  dailySalesOverview,
  creditSummary,
  supplierPayables,
  startDate,
  endDate,
  isRangeMode,
}) => {
  return (
    <section className="p-6 bg-white shadow-lg rounded-2xl sm:p-7 lg:p-8">
      <h3 className="flex items-center gap-2 mb-6 text-base font-semibold text-accent/90 sm:text-lg">
        <span className="text-xl">📊</span>
        Quick Summary {isRangeMode && `(${startDate} to ${endDate})`}
      </h3>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 sm:gap-6">
        <div className="p-4 transition-colors border bg-white/10 backdrop-blur-sm rounded-xl sm:p-5 border-white/20 hover:bg-white/15">
          <p className="mb-2 text-xs text-status-success sm:text-sm">
            {isRangeMode ? "Period Revenue" : "Daily Revenue"}
          </p>
          <p className="text-lg font-bold text-status-success sm:text-xl">
            {typeof dailySalesOverview?.totalSalesAmount === "number"
              ? `LKR ${dailySalesOverview.totalSalesAmount.toLocaleString(
                  "en-US",
                  {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  },
                )}`
              : "LKR 0"}
          </p>
        </div>
        <div className="p-4 transition-colors border bg-white/10 backdrop-blur-sm rounded-xl sm:p-5 border-white/20 hover:bg-white/15">
          <p className="mb-2 text-xs text-status-success sm:text-sm">
            {isRangeMode ? "Total Invoices" : "Invoices Today"}
          </p>
          <p className="text-lg font-bold text-status-success sm:text-xl">
            {dailySalesOverview?.invoiceCount || 0}
          </p>
        </div>
        <div className="p-4 transition-colors border bg-white/10 backdrop-blur-sm rounded-xl sm:p-5 border-white/20 hover:bg-white/15">
          <p className="mb-2 text-xs text-error sm:text-sm">Credit Given</p>
          <p className="text-lg font-bold text-error sm:text-xl">
            {typeof creditSummary?.totalCreditGiven === "number"
              ? `LKR ${creditSummary.totalCreditGiven.toLocaleString("en-US", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}`
              : "LKR 0"}
          </p>
        </div>
        <div className="p-4 transition-colors border bg-white/10 backdrop-blur-sm rounded-xl sm:p-5 border-white/20 hover:bg-white/15">
          <p className="mb-2 text-xs text-status-warning sm:text-sm">
            Payables
          </p>
          <p className="text-lg font-bold text-status-warning sm:text-xl">
            {typeof supplierPayables?.totalOutstanding === "number"
              ? `LKR ${supplierPayables.totalOutstanding.toLocaleString(
                  "en-US",
                  {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  },
                )}`
              : "LKR 0"}
          </p>
        </div>
      </div>
    </section>
  );
};

export default QuickSummarySection;
