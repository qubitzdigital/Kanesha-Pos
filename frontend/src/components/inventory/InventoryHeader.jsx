import React from "react";
import { PageHeader, ActionButton } from "../common";

const InventoryHeader = ({ onAddNew, lowStockOnly, setLowStockOnly }) => {
  return (
    <PageHeader
      icon="📦"
      title="Inventory Management"
      description="Stock changes happen only via GRN / Sales / Adjustments"
      action={
        <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-3">
          <ActionButton
            label="Add New Item"
            icon="+"
            onClick={onAddNew}
            variant="primary"
            size="lg"
            className="w-full sm:w-auto"
          />
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm">
            <input
              type="checkbox"
              id="lowStockOnly"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="h-4 w-4 text-primary rounded focus:ring-primary cursor-pointer"
            />
            <label
              htmlFor="lowStockOnly"
              className="text-xs sm:text-sm font-medium text-gray-700 cursor-pointer"
            >
              Show only low stock
            </label>
          </div>
        </div>
      }
    />
  );
};

export default InventoryHeader;
