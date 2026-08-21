import React from "react";
import { EmptyState, ActionButton } from "../common";
import CustomerTableRow from "./CustomerTableRow";

const CustomerTable = ({
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
  return (
    <div className="overflow-x-auto hidden lg:block">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Customer Details
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Contact
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Credit Information
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {customers.length === 0 ? (
            <tr>
              <td colSpan="4" className="px-6 py-12 text-center">
                <EmptyState
                  icon="👥"
                  title={
                    searchQuery ? "No customers found" : "No customers yet"
                  }
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
                      />
                    )
                  }
                />
              </td>
            </tr>
          ) : (
            customers.map((customer) => (
              <CustomerTableRow
                key={customer._id}
                customer={customer}
                onDetails={onDetails}
                onEdit={onEdit}
                onDelete={onDelete}
                onPayment={onPayment}
                currencySymbol={currencySymbol}
                currencyPosition={currencyPosition}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CustomerTable;
