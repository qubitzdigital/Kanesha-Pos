import React from "react";

const SupplierStatus = ({ form, suppliers, updateField }) => {
  return (
    <div className="border-t border-gray-200 pt-6">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
        Supplier & Status
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Default Supplier
          </label>
          <select
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm transition-all"
            value={form.defaultSupplier}
            onChange={(e) => updateField("defaultSupplier", e.target.value)}
          >
            <option value="">Select supplier</option>
            {suppliers.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => updateField("isActive", e.target.checked)}
            className="h-5 w-5 text-primary rounded focus:ring-primary cursor-pointer"
          />
          <div>
            <div className="font-medium text-gray-900">Active</div>
            <div className="text-xs text-gray-500">
              Active items are visible in sales & search.
            </div>
          </div>
        </label>
      </div>
    </div>
  );
};

export default SupplierStatus;
