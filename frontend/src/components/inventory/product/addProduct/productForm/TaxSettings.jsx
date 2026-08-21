import React from "react";

const TaxSettings = ({ form, errs, updateField }) => {
  return (
    <div className="border-t border-gray-200 pt-6">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
        Tax Settings
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="taxApplicable"
            checked={form.taxApplicable}
            onChange={(e) => updateField("taxApplicable", e.target.checked)}
            className="h-5 w-5 text-primary rounded focus:ring-primary cursor-pointer"
          />
          <label
            htmlFor="taxApplicable"
            className="text-sm font-medium text-gray-700"
          >
            This item is taxable
          </label>
        </div>

        {form.taxApplicable && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Tax Rate (%) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm transition-all ${
                errs.taxRate ? "border-red-300 bg-red-50" : "border-gray-300"
              }`}
              value={form.taxRate}
              onChange={(e) => updateField("taxRate", e.target.value)}
            />
            {errs.taxRate && (
              <p className="text-xs text-red-600">{errs.taxRate}</p>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Tax Code (HSN/SAC)
          </label>
          <input
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm transition-all"
            value={form.taxCode}
            onChange={(e) => updateField("taxCode", e.target.value)}
            placeholder="Optional"
          />
        </div>
      </div>
    </div>
  );
};

export default TaxSettings;
