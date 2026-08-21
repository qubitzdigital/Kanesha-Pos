import React from "react";

const PricingSection = ({ form, errs, updateField }) => {
  return (
    <div className="border-t border-gray-200 pt-6">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
        Pricing
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Cost Price <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="0"
            step="1"
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm transition-all ${
              errs.costPrice ? "border-red-300 bg-red-50" : "border-gray-300"
            }`}
            value={form.costPrice}
            onChange={(e) => updateField("costPrice", e.target.value)}
            onWheel={(e) => e.target.blur()}
          />
          {errs.costPrice && (
            <p className="text-xs text-red-600">{errs.costPrice}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Selling Price <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="0"
            step="1"
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm transition-all ${
              errs.sellingPrice ? "border-red-300 bg-red-50" : "border-gray-300"
            }`}
            value={form.sellingPrice}
            onChange={(e) => updateField("sellingPrice", e.target.value)}
            onWheel={(e) => e.target.blur()}
          />
          {errs.sellingPrice && (
            <p className="text-xs text-red-600">{errs.sellingPrice}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PricingSection;
