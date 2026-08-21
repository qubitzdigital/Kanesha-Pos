import React from "react";
import { PageHeader } from "../common";
import { formatCurrency } from "../../utils/currency";

const ExpensesHeader = ({
  totalExpenses,
  categories,
  expenses,
  currencySymbol = "Rs.",
  currencyPosition = "before",
}) => {
  const currentMonthTotal = expenses
    .filter((e) => {
      const expenseDate = new Date(e.date);
      const now = new Date();
      return (
        expenseDate.getMonth() === now.getMonth() &&
        expenseDate.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  return (
    <>
      <PageHeader
        icon="💸"
        title="Expense Management"
        description="Record and track daily expenses including rent, salaries, transport, electricity, and other operational costs. Maintain financial clarity with categorized expense tracking."
        className="mb-0"
        action={
          <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-200 min-w-[200px]">
            <p className="text-xs text-gray-500 font-medium">Total Expenses</p>
            <p className="text-xl font-bold text-gray-800 truncate">
              {formatCurrency(totalExpenses, currencySymbol, currencyPosition)}
            </p>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-medium">Categories</p>
            <p className="text-lg font-bold text-gray-800">
              {categories.length}
            </p>
          </div>
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-blue-600 text-lg">📊</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-medium">Total Records</p>
            <p className="text-lg font-bold text-gray-800">{expenses.length}</p>
          </div>
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-green-600 text-lg">📈</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs text-gray-500 font-medium">Current Month</p>
            <p className="text-lg font-bold text-gray-800 truncate">
              {formatCurrency(
                currentMonthTotal,
                currencySymbol,
                currencyPosition,
              )}
            </p>
          </div>
          <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-purple-600 text-lg">💰</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default ExpensesHeader;
