import React from "react";
import { formatCurrency } from "../../utils/currency";

const CustomerTableRow = ({
  customer,
  onDetails,
  onEdit,
  onDelete,
  onPayment,
  currencySymbol = "Rs.",
  currencyPosition = "before",
}) => {
  const c = customer;
  const creditLimit = Number(c.creditLimit || 0);
  const currentBalance = Number(c.currentBalance || 0);
  const ratio = creditLimit > 0 ? currentBalance / creditLimit : 0;

  return (
    <tr
      className="transition-colors cursor-pointer hover:bg-gray-50/50 group"
      onClick={() => onDetails(c)}
    >
      {/* Customer Details */}
      <td className="px-6 py-4">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              currentBalance > 0
                ? "bg-red-100 text-red-600"
                : "bg-green-100 text-green-600"
            }`}
          >
            <span className="text-lg">{currentBalance > 0 ? "💳" : "✅"}</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 font-semibold text-gray-900">
              <span className="truncate max-w-[160px] sm:max-w-xs md:max-w-none">
                {c.name}
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  c.type === "cash"
                    ? "bg-yellow-100 text-yellow-800"
                    : c.type === "credit"
                      ? "bg-purple-100 text-purple-800"
                      : "bg-blue-100 text-blue-800"
                }`}
              >
                {c.type === "cash"
                  ? "Cash Only"
                  : c.type === "credit"
                    ? "Credit Only"
                    : "Cash & Credit"}
              </span>
            </div>
            {c.address && (
              <p className="max-w-xs mt-1 text-sm text-gray-500 truncate">
                📍 {c.address}
              </p>
            )}
          </div>
        </div>
      </td>

      {/* Contact */}
      <td className="px-6 py-4">
        <div className="space-y-1">
          {c.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <span>📞</span>
              <span className="break-all">{c.phone}</span>
            </div>
          )}
          {c.nic && <div className="text-xs text-gray-500">NIC: {c.nic}</div>}
        </div>
      </td>

      {/* Credit Information */}
      <td className="px-6 py-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-gray-600">Credit Limit:</span>
            <span className="font-medium text-gray-900">
              {formatCurrency(creditLimit, currencySymbol, currencyPosition)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-gray-600">Outstanding:</span>
            <span
              className={`font-bold ${
                currentBalance > 0 ? "text-red-600" : "text-green-600"
              }`}
            >
              {formatCurrency(currentBalance, currencySymbol, currencyPosition)}
            </span>
          </div>
          {creditLimit > 0 && (
            <div className="w-full h-2 bg-gray-200 rounded-full">
              <div
                className={`h-2 rounded-full ${
                  ratio > 0.8
                    ? "bg-red-500"
                    : ratio > 0.5
                      ? "bg-yellow-500"
                      : "bg-green-500"
                }`}
                style={{
                  width: `${Math.min(ratio * 100, 100)}%`,
                }}
              ></div>
            </div>
          )}
        </div>
      </td>

      {/* Actions */}
      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-wrap items-center gap-2">
          {currentBalance > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPayment(c);
              }}
              className="px-4 py-2 font-medium text-white transition-all duration-200 rounded-lg cursor-pointer bg-gradient-to-r from-green-500 to-green-600 hover:shadow-md active:scale-95"
            >
              💳 Pay
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(c);
            }}
            className="px-4 py-2 font-medium text-blue-700 transition-all duration-200 bg-blue-100 rounded-lg cursor-pointer hover:bg-blue-200 hover:shadow-md active:scale-95"
          >
            ✏️ Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(c);
            }}
            className="px-4 py-2 font-medium text-red-600 transition-all duration-200 bg-red-100 rounded-lg cursor-pointer hover:bg-red-200 hover:shadow-md active:scale-95"
            title="Delete customer"
          >
            🗑️ Delete
          </button>
        </div>
      </td>
    </tr>
  );
};

export default CustomerTableRow;
