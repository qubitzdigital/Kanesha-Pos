import React from "react";
import { EmptyState, ActionButton } from "../common";
import EntityCardList from "../common/EntityCardList";
import { formatCurrency } from "../../utils/currency";

const CustomerMobileCard = ({
  customers,
  searchQuery,
  onDetails,
  onEdit,
  onDelete,
  onPayment,
  onAddNew,
  currencySymbol = "Rs.",
  currencyPosition = "before",
}) => {
  const renderCard = (c) => {
    const creditLimit = Number(c.creditLimit || 0);
    const currentBalance = Number(c.currentBalance || 0);
    const ratio = creditLimit > 0 ? currentBalance / creditLimit : 0;
    const barColor =
      ratio > 0.8
        ? "bg-red-500"
        : ratio > 0.5
          ? "bg-yellow-500"
          : "bg-green-500";

    return (
      <div
        className="p-3 transition-shadow bg-white border border-gray-200 shadow-sm rounded-xl hover:shadow-md sm:p-4"
        onClick={() => onDetails(c)}
      >
        {/* Top Row: Icon + Name + Type + Outstanding */}
        <div className="flex gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              c.currentBalance > 0
                ? "bg-red-100 text-red-600"
                : "bg-green-100 text-green-600"
            }`}
          >
            <span className="text-lg">
              {c.currentBalance > 0 ? "💳" : "✅"}
            </span>
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-gray-900 text-sm truncate max-w-[160px] xs:max-w-[200px] sm:max-w-[240px]">
                    {c.name}
                  </p>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
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
                  <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">
                    📍 {c.address}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-[11px] text-gray-600">Outstanding</p>
                <p
                  className={`text-sm font-bold ${
                    currentBalance > 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {formatCurrency(
                    currentBalance,
                    currencySymbol,
                    currencyPosition,
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="mt-2 space-y-1">
          {c.phone && (
            <div className="flex items-center gap-2 text-xs text-gray-700">
              <span>📞</span>
              <span className="break-all">{c.phone}</span>
            </div>
          )}
          {c.nic && (
            <div className="text-[11px] text-gray-500">NIC: {c.nic}</div>
          )}
        </div>

        {/* Credit Info + Progress */}
        <div className="mt-3 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Credit Limit</span>
            <span className="font-medium text-gray-900">
              {formatCurrency(creditLimit, currencySymbol, currencyPosition)}
            </span>
          </div>
          {creditLimit > 0 && (
            <>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${barColor}`}
                  style={{
                    width: `${Math.min(ratio * 100, 100)}%`,
                  }}
                ></div>
              </div>
              <div className="flex justify-between text-[11px] text-gray-500">
                <span>Used</span>
                <span>{Math.min(ratio * 100, 100).toFixed(0)}%</span>
              </div>
            </>
          )}
        </div>

        {/* Actions – tap-friendly buttons */}
        <div
          className="flex flex-wrap gap-2 mt-3"
          onClick={(e) => e.stopPropagation()}
        >
          {currentBalance > 0 && (
            <button
              onClick={() => onPayment(c)}
              className="flex-1 min-w-[90px] px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:shadow-md active:scale-95 transition-all duration-200 cursor-pointer text-center"
            >
              💳 Pay
            </button>
          )}
          <button
            onClick={() => onEdit(c)}
            className="flex-1 min-w-[90px] px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs sm:text-sm font-medium hover:shadow-md active:scale-95 transition-all duration-200 cursor-pointer text-center"
          >
            ✏️ Edit
          </button>
          <button
            onClick={() => onDelete(c)}
            className="flex-1 min-w-[90px] px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs sm:text-sm font-medium hover:shadow-md active:scale-95 transition-all duration-200 cursor-pointer text-center"
            title="Delete customer"
          >
            🗑️ Delete
          </button>
        </div>
      </div>
    );
  };

  const emptyState = (
    <div className="px-6 py-10">
      <EmptyState
        icon="👥"
        title={searchQuery ? "No customers found" : "No customers yet"}
        description={
          searchQuery
            ? "Try adjusting your search query"
            : "Get started by adding your first customer"
        }
        action={
          !searchQuery && (
            <ActionButton
              label="Add First Customer"
              icon="+"
              onClick={onAddNew}
              variant="primary"
              size="md"
            />
          )
        }
      />
    </div>
  );

  return (
    <div className="block lg:hidden">
      <EntityCardList
        items={customers}
        renderCard={renderCard}
        emptyState={emptyState}
      />
    </div>
  );
};

export default CustomerMobileCard;
