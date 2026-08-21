import React from "react";
import CloseButton from "../common/CloseButton";
import { formatCurrency } from "../../utils/currency";

const ReportModal = ({
  activeModal,
  modalData,
  modalLoading,
  searchTerm,
  onSearchChange,
  onClose,
  onExportCSV,
  onExportPDF,
  reportData,
  currencySymbol = "Rs.",
  currencyPosition = "before",
}) => {
  if (!activeModal) return null;

  const getFilteredData = () => {
    if (!modalData) return [];

    const searchLower = searchTerm.toLowerCase();

    if (activeModal === "sales") {
      return modalData.filter(
        (sale) =>
          sale.invoiceNumber?.toLowerCase().includes(searchLower) ||
          sale.customerName?.toLowerCase().includes(searchLower) ||
          sale.items?.some((item) =>
            item.itemName?.toLowerCase().includes(searchLower),
          ),
      );
    }

    if (activeModal === "expenses") {
      return modalData.filter(
        (expense) =>
          expense.category?.toLowerCase().includes(searchLower) ||
          expense.description?.toLowerCase().includes(searchLower) ||
          expense.createdBy?.username?.toLowerCase().includes(searchLower),
      );
    }

    return [];
  };

  const filteredData = getFilteredData();

  const renderSalesTable = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Invoice #
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Customer
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Items
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
              Total
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
              VAT
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
              Profit
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredData.map((sale, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm font-medium text-blue-600">
                {sale.invoiceNumber}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">
                {new Date(sale.createdAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">
                {sale.customerName || "Walk-in"}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                <div className="max-h-20 overflow-y-auto">
                  {sale.items?.map((item, idx) => (
                    <div key={idx} className="text-xs">
                      {item.itemName} (x{item.quantity})
                    </div>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                {formatCurrency(
                  sale.totalAmount,
                  currencySymbol,
                  currencyPosition,
                )}
              </td>
              <td className="px-4 py-3 text-sm text-right text-gray-600">
                {formatCurrency(
                  sale.vatAmount,
                  currencySymbol,
                  currencyPosition,
                )}
              </td>
              <td className="px-4 py-3 text-sm text-right font-medium text-green-600">
                {formatCurrency(sale.profit, currencySymbol, currencyPosition)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderExpensesTable = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Category
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Description
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Created By
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
              Amount
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredData.map((expense, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm text-gray-900">
                {new Date(expense.date).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 text-sm">
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                  {expense.category}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {expense.description}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {expense.createdBy?.username || "N/A"}
              </td>
              <td className="px-4 py-3 text-sm text-right font-medium text-red-600">
                {formatCurrency(
                  expense.amount,
                  currencySymbol,
                  currencyPosition,
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderProfitBreakdown = () => (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-gray-600">Gross Profit</p>
          <p className="text-2xl font-bold text-green-700">
            {formatCurrency(
              reportData.grossProfit,
              currencySymbol,
              currencyPosition,
            )}
          </p>
        </div>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-gray-600">Total Expenses</p>
          <p className="text-2xl font-bold text-red-700">
            {formatCurrency(
              reportData.totalExpenses,
              currencySymbol,
              currencyPosition,
            )}
          </p>
        </div>
        <div
          className={`p-4 rounded-lg border ${
            reportData.netProfit >= 0
              ? "bg-emerald-50 border-emerald-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          <p className="text-sm text-gray-600">Net Profit</p>
          <p
            className={`text-2xl font-bold ${
              reportData.netProfit >= 0 ? "text-emerald-700" : "text-red-700"
            }`}
          >
            {formatCurrency(
              reportData.netProfit,
              currencySymbol,
              currencyPosition,
            )}
          </p>
        </div>
      </div>

      {/* Profit Breakdown */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-3">Calculation</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-gray-600">Total Sales</span>
            <span className="font-medium">
              {formatCurrency(
                reportData.totalSales,
                currencySymbol,
                currencyPosition,
              )}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-gray-600">Cost of Goods Sold (COGS)</span>
            <span className="font-medium text-red-600">
              -{" "}
              {formatCurrency(
                reportData.totalSales - reportData.grossProfit,
                currencySymbol,
                currencyPosition,
              )}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-300 font-semibold">
            <span className="text-gray-700">Gross Profit</span>
            <span className="text-green-600">
              {formatCurrency(
                reportData.grossProfit,
                currencySymbol,
                currencyPosition,
              )}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-gray-600">Operating Expenses</span>
            <span className="font-medium text-red-600">
              -{" "}
              {formatCurrency(
                reportData.totalExpenses,
                currencySymbol,
                currencyPosition,
              )}
            </span>
          </div>
          <div className="flex justify-between py-3 bg-white rounded px-2 font-bold text-base">
            <span
              className={
                reportData.netProfit >= 0 ? "text-emerald-700" : "text-red-700"
              }
            >
              Net Profit
            </span>
            <span
              className={
                reportData.netProfit >= 0 ? "text-emerald-700" : "text-red-700"
              }
            >
              {formatCurrency(
                reportData.netProfit,
                currencySymbol,
                currencyPosition,
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Profit Margin */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-gray-600 mb-2">Profit Margin</p>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                reportData.netProfit >= 0 ? "bg-emerald-500" : "bg-red-500"
              }`}
              style={{
                width: `${Math.abs(
                  (reportData.netProfit / reportData.totalSales) * 100,
                )}%`,
              }}
            ></div>
          </div>
          <span
            className={`text-lg font-bold ${
              reportData.netProfit >= 0 ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {reportData.totalSales > 0
              ? ((reportData.netProfit / reportData.totalSales) * 100).toFixed(
                  1,
                )
              : 0}
            %
          </span>
        </div>
      </div>
    </div>
  );

  const getModalTitle = () => {
    if (activeModal === "sales") return "Sales Details";
    if (activeModal === "expenses") return "Expenses Details";
    if (activeModal === "profit") return "Profit Breakdown";
    return "";
  };

  const getRecordCount = () => {
    if (activeModal === "profit") return "";
    return filteredData.length > 0
      ? `${filteredData.length} record${filteredData.length !== 1 ? "s" : ""}`
      : "No records found";
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-white/75 backdrop-blur-sm"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">
                {getModalTitle()}
              </h3>
              <CloseButton
                onClick={onClose}
                variant="subtle"
                size="md"
                ariaLabel="Close modal"
                className="text-white hover:text-gray-200"
              />
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-6 py-4">
            {modalLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                {/* Search and Export Bar */}
                {activeModal !== "profit" && (
                  <div className="mb-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                    <div className="relative flex-1 max-w-md">
                      <input
                        type="text"
                        placeholder={`Search ${activeModal}...`}
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <svg
                        className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={onExportCSV}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        Export CSV
                      </button>
                      <button
                        onClick={onExportPDF}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                        Export PDF
                      </button>
                    </div>
                  </div>
                )}

                {/* Record Count */}
                {activeModal !== "profit" && (
                  <div className="mb-3 text-sm text-gray-600">
                    {getRecordCount()}
                  </div>
                )}

                {/* Table Content */}
                {activeModal === "sales" && renderSalesTable()}
                {activeModal === "expenses" && renderExpensesTable()}
                {activeModal === "profit" && renderProfitBreakdown()}

                {/* Export buttons for profit modal */}
                {activeModal === "profit" && (
                  <div className="mt-4 flex gap-2 justify-end">
                    <button
                      onClick={onExportCSV}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Export CSV
                    </button>
                    <button
                      onClick={onExportPDF}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                      Export PDF
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
