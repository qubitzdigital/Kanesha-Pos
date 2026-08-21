import React from "react";
import AppLoader from "../common/AppLoader";
import { formatCurrency } from "../../utils/currency";

/**
 * Profit Cards Component
 * Displays profit metrics: Today's profit, this month's profit, profit per invoice
 *
 * NOTE: Logic is unchanged. Only styling and layout have been enhanced.
 */
const ProfitCardsSection = ({
  todayMetrics,
  monthMetrics,
  loading = false,
  currencySymbol = "Rs.",
  currencyPosition = "before",
}) => {
  const cards = [
    {
      label: "Gross Profit",
      value: todayMetrics?.grossProfit,
      subtext: `${todayMetrics?.invoiceCount || 0} invoices`,
      icon: "📅",
      color: "blue",
    },
    {
      label: "Net Profit (After Expenses)",
      value: todayMetrics?.netProfit,
      subtext: `Expenses: ${formatCurrency(
        todayMetrics?.totalExpenses || 0,
        currencySymbol,
        currencyPosition,
      )}`,
      icon: "💰",
      color: "green",
    },
    {
      label: "Monthly Net Profit",
      value: monthMetrics?.netProfit,
      subtext: `Expenses: ${formatCurrency(
        monthMetrics?.totalExpenses || 0,
        currencySymbol,
        currencyPosition,
      )}`,
      icon: "📊",
      color: "purple",
    },
  ];

  const colorClasses = {
    blue: "from-blue-300 to-blue-400",
    green: "from-green-300 to-green-400",
    purple: "from-purple-300 to-purple-400",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <AppLoader
          open
          variant="inline"
          title="Loading profit metrics"
          subtitle="Calculating margins and revenue"
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Desktop / Large Tablet View (original grid layout) */}
      <div className="hidden grid-cols-1 gap-4 md:grid md:grid-cols-3 md:gap-5 lg:gap-6">
        {cards.map((card, idx) => (
          <div
            key={idx}
            className={`relative overflow-hidden bg-gradient-to-br ${
              colorClasses[card.color]
            } rounded-2xl p-5 sm:p-6 text-white shadow-md hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200`}
          >
            {/* Subtle decorative circles */}
            <div className="absolute w-24 h-24 border rounded-full pointer-events-none -right-8 -top-8 border-white/20 opacity-40" />
            <div className="absolute w-20 h-20 border rounded-full pointer-events-none -right-12 top-8 border-white/10 opacity-30" />

            <div className="relative z-10 flex items-start justify-between mb-4">
              <span className="text-2xl sm:text-3xl">{card.icon}</span>
            </div>

            <h3 className="relative z-10 text-xs sm:text-sm font-medium text-white/90 mb-1.5 tracking-wide uppercase">
              {card.label}
            </h3>

            <p className="relative z-10 mb-1 text-2xl font-bold sm:text-3xl">
              {typeof card.value === "number"
                ? formatCurrency(card.value, currencySymbol, currencyPosition)
                : formatCurrency(0, currencySymbol, currencyPosition)}
            </p>

            <p className="relative z-10 text-xs font-semibold text-white sm:text-sm">
              {card.subtext}
            </p>
          </div>
        ))}
      </div>

      {/* Mobile / Small Tablet View (stacked cards for better UX) */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {cards.map((card, idx) => (
          <div
            key={idx}
            className={`relative overflow-hidden bg-gradient-to-br ${
              colorClasses[card.color]
            } rounded-2xl p-4 sm:p-5 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200`}
          >
            {/* Subtle decorative circles (same style, smaller screens) */}
            <div className="absolute w-24 h-24 border rounded-full pointer-events-none -right-10 -top-10 border-white/20 opacity-40" />
            <div className="absolute w-20 h-20 border rounded-full pointer-events-none -right-14 top-6 border-white/10 opacity-30" />

            <div className="relative z-10 flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{card.icon}</span>
                <h3 className="text-xs font-medium tracking-wide uppercase sm:text-sm text-white/90">
                  {card.label}
                </h3>
              </div>
            </div>

            <div className="relative z-10 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
              <p className="text-2xl font-bold">
                {typeof card.value === "number"
                  ? formatCurrency(card.value, currencySymbol, currencyPosition)
                  : formatCurrency(0, currencySymbol, currencyPosition)}
              </p>
              <p className="text-xs sm:text-sm text-white/80">{card.subtext}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfitCardsSection;
