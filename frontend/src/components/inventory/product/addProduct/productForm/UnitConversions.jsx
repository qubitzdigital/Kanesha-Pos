import React from "react";

const UnitConversions = ({
  form,
  errs,
  updateField,
  addUnitRow,
  updateUnitRow,
  removeUnitRow,
}) => {
  return (
    <div className="border-t border-gray-200 pt-6">
      <div className="flex items-start sm:items-center justify-between gap-3 mb-3">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
            Unit Conversions
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Example: 1 box = 10 {form.baseUnit}
          </p>
        </div>

        <button
          type="button"
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 active:scale-95 transition-all text-sm cursor-pointer"
          onClick={addUnitRow}
        >
          + Add Unit
        </button>
      </div>

      {errs.units && <p className="text-sm text-red-600 mb-3">{errs.units}</p>}

      {(form.units || []).length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-4 text-center text-sm text-gray-600">
          No unit conversions added.
        </div>
      ) : (
        <div className="space-y-3">
          {(form.units || []).map((u, idx) => (
            <div key={idx} className="bg-gray-50 rounded-xl p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Unit
                  </label>
                  <input
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                    value={u.fromUnit || ""}
                    onChange={(e) =>
                      updateUnitRow(idx, { fromUnit: e.target.value })
                    }
                    placeholder="e.g., box"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Multiplier
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                    value={u.multiplier ?? ""}
                    onChange={(e) =>
                      updateUnitRow(idx, { multiplier: e.target.value })
                    }
                    placeholder="e.g., 10"
                  />
                </div>

                <div className="flex items-end gap-2">
                  <div className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-2">
                    <span className="text-sm text-gray-900">
                      = {form.baseUnit}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm cursor-pointer"
                    onClick={() => removeUnitRow(idx)}
                    title="Remove"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UnitConversions;
