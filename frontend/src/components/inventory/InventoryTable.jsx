import React from "react";
import { EmptyState, ActionButton } from "../common";
import InventoryTableRow from "./InventoryTableRow";

const InventoryTable = ({
  items,
  onEdit,
  onEditStock,
  onDetails,
  onActivate,
  onDeactivate,
  onDelete,
  onPrintBarcode,
  onOpenGRN,
  onAddNew,
  lowStockOnly,
  currencySymbol = "Rs.",
  currencyPosition = "before",
}) => {
  return (
    <div className="hidden overflow-x-auto lg:block">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-4 text-xs font-semibold text-left text-gray-700 uppercase">
              Item
            </th>
            <th className="px-6 py-4 text-xs font-semibold text-left text-gray-700 uppercase">
              Category
            </th>
            <th className="px-6 py-4 text-xs font-semibold text-left text-gray-700 uppercase">
              On-hand
            </th>
            <th className="px-6 py-4 text-xs font-semibold text-left text-gray-700 uppercase">
              Selling
            </th>
            <th className="px-6 py-4 text-xs font-semibold text-left text-gray-700 uppercase">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200">
          {items.map((item) => (
            <InventoryTableRow
              key={item._id}
              item={item}
              currencySymbol={currencySymbol}
              currencyPosition={currencyPosition}
              onEdit={onEdit}
              onEditStock={onEditStock}
              onDetails={onDetails}
              onActivate={onActivate}
              onDeactivate={onDeactivate}
              onDelete={onDelete}
              onPrintBarcode={onPrintBarcode}
              onOpenGRN={onOpenGRN}
            />
          ))}

          {items.length === 0 && (
            <tr>
              <td colSpan="5" className="px-6 py-12">
                <EmptyState
                  icon="📦"
                  title="No items found"
                  description={
                    lowStockOnly
                      ? "No low stock items"
                      : "Try adjusting your search or filters"
                  }
                  action={
                    <ActionButton
                      label="+ Add Your First Item"
                      onClick={onAddNew}
                    />
                  }
                />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default InventoryTable;
