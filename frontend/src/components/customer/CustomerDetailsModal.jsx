import React from "react";
import CloseButton from "../common/CloseButton";
import { formatCurrency } from "../../utils/currency";

const CustomerDetailsModal = ({
  open,
  customer,
  onClose,
  currencySymbol = "Rs.",
  currencyPosition = "before",
}) => {
  if (!open || !customer) return null;

  return (
    <div className="fixed inset-0 bg-white/75 backdrop-blur-sm flex items-center justify-center z-50 px-3">
      <div className="bg-white rounded-2xl p-5 w-full max-w-md shadow-lg">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-gray-800">
            Customer Details
          </h3>
          <CloseButton
            onClick={onClose}
            size="md"
            ariaLabel="Close customer details"
          />
        </div>

        <div className="space-y-2 text-sm text-gray-800">
          <DetailRow label="Name" value={customer.name} />
          <DetailRow label="Phone" value={customer.phone} />
          <DetailRow label="Address" value={customer.address || "-"} />
          <DetailRow label="NIC" value={customer.nic || "-"} />
          <DetailRow label="Type" value={customer.type || "-"} />
          <DetailRow
            label="Credit Limit"
            value={
              typeof customer.creditLimit === "number"
                ? formatCurrency(
                    customer.creditLimit,
                    currencySymbol,
                    currencyPosition,
                  )
                : "-"
            }
          />
          <DetailRow
            label="Outstanding"
            value={
              typeof customer.currentBalance === "number"
                ? formatCurrency(
                    customer.currentBalance,
                    currencySymbol,
                    currencyPosition,
                  )
                : "-"
            }
          />
          <DetailRow label="Notes" value={customer.notes || "-"} />
        </div>

        <div className="flex justify-end gap-3 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-xl text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            ✕ Close
          </button>
        </div>
      </div>
    </div>
  );
};

const DetailRow = ({ label, value }) => (
  <div className="flex justify-between gap-4">
    <span className="font-semibold text-gray-700">{label}:</span>
    <span className="text-gray-800 text-right flex-1">{value}</span>
  </div>
);

export default CustomerDetailsModal;
