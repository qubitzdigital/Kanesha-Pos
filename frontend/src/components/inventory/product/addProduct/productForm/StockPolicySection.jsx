import React from "react";

const StockPolicySection = ({ form, errs, updateField }) => {
  return (
    <div className="border-t border-gray-200 pt-6">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
        Stock Policy
      </h3>
      <p className="text-xs text-gray-500 mb-4">
        These do not change stock quantities. Stock changes happen only via
        GRN/Sales/Adjustments.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Low Stock Level <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="0"
            step="1"
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm transition-all ${
              errs.lowStockLevel
                ? "border-red-300 bg-red-50"
                : "border-gray-300"
            }`}
            value={form.lowStockLevel}
            onChange={(e) => updateField("lowStockLevel", e.target.value)}
          />
          {errs.lowStockLevel && (
            <p className="text-xs text-red-600">{errs.lowStockLevel}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Reorder Quantity
          </label>
          <input
            type="number"
            min="0"
            step="1"
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm transition-all ${
              errs.reorderQuantity
                ? "border-red-300 bg-red-50"
                : "border-gray-300"
            }`}
            value={form.reorderQuantity}
            onChange={(e) => updateField("reorderQuantity", e.target.value)}
          />
          {errs.reorderQuantity && (
            <p className="text-xs text-red-600">{errs.reorderQuantity}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockPolicySection;
