import React from "react";
import AppLoader from "../common/AppLoader";
import { formatCurrency } from "../../utils/currency";

const ExpensesTable = ({
  expenses,
  loading,
  totalExpenses,
  handleEdit,
  handleDelete,
  loadExpenses,
  currencySymbol = "Rs.",
  currencyPosition = "before",
}) => {
  return (
    <section className="bg-white rounded-2xl shadow-lg border border-gray-200 flex flex-col overflow-hidden">
      <div className="p-5 sm:p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">
              Expense History
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Recent expense records sorted by date.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadExpenses}
              className="px-3 sm:px-4 py-2 rounded-xl border border-gray-300 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 hover:shadow-sm active:scale-95 transition-all cursor-pointer inline-flex items-center gap-2 self-start sm:self-auto"
            >
              <span>🔄</span>
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-10 px-4">
            <AppLoader
              open
              variant="inline"
              title="Loading expenses"
              subtitle="Fetching recent expense records"
            />
          </div>
        ) : expenses.length > 0 ? (
          <>
            {/* Table wrapper with responsive scroll & max height */}
            <div className="overflow-x-auto max-h-[420px]">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="text-left py-3 sm:py-4 px-4 sm:px-6 text-[10px] sm:text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="text-left py-3 sm:py-4 px-4 sm:px-6 text-[10px] sm:text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="text-left py-3 sm:py-4 px-4 sm:px-6 text-[10px] sm:text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="text-left py-3 sm:py-4 px-4 sm:px-6 text-[10px] sm:text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {expenses.map((e) => (
                    <tr
                      key={e._id}
                      className="hover:bg-gray-50 transition-colors group"
                    >
                      <td className="py-3 sm:py-4 px-4 sm:px-6 align-top whitespace-nowrap">
                        <div className="text-xs sm:text-sm font-medium text-gray-900">
                          {e.date ? e.date.substring(0, 10) : ""}
                        </div>
                      </td>
                      <td className="py-3 sm:py-4 px-4 sm:px-6 align-top min-w-[140px] sm:min-w-[200px]">
                        <div className="font-medium text-gray-900 text-xs sm:text-sm">
                          {e.category}
                        </div>
                        {e.description && (
                          <div className="text-[11px] sm:text-xs text-gray-500 mt-1 line-clamp-2">
                            {e.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3 sm:py-4 px-4 sm:px-6 align-top whitespace-nowrap">
                        <div className="text-xs sm:text-sm font-semibold text-gray-900">
                          {formatCurrency(
                            Number(e.amount || 0),
                            currencySymbol,
                            currencyPosition,
                          )}
                        </div>
                      </td>
                      <td className="py-3 sm:py-4 px-4 sm:px-6 align-top">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            className="inline-flex items-center justify-center gap-1 text-[11px] sm:text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors px-2.5 py-1 rounded-lg hover:bg-blue-50"
                            onClick={() => handleEdit(e)}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center gap-1 text-[11px] sm:text-sm font-medium text-red-600 hover:text-red-800 hover:underline cursor-pointer transition-colors px-2.5 py-1 rounded-lg hover:bg-red-50"
                            onClick={() => handleDelete(e._id)}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer summary */}
            <div className="border-t border-gray-200 bg-gray-50 px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <p className="text-xs sm:text-sm text-gray-600">
                  Showing <span className="font-medium">{expenses.length}</span>{" "}
                  expense{expenses.length !== 1 ? "s" : ""}.
                </p>
                <p className="text-xs sm:text-sm font-medium text-gray-900">
                  Total:{" "}
                  {formatCurrency(
                    totalExpenses,
                    currencySymbol,
                    currencyPosition,
                  )}
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl text-gray-400">📄</span>
            </div>
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1">
              No expenses recorded yet
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto">
              Start by adding your first expense using the form on the left.
              Your expense history will appear here.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default ExpensesTable;
