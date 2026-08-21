import React from "react";

/**
 * VariantsSection
 * Lets the user add multiple sizes for the SAME item (same name, same barcode).
 * Each size row only carries what differs: size label, its own price, and its own stock.
 */
const VariantsSection = ({
  form,
  errs,
  updateField,
  addVariantRow,
  removeVariantRow,
  updateVariantField,
}) => {
  const variants = form.variants || [];
  const combinedWithBatches = Boolean(form.hasVariants && form.isBatchTracked);

  return (
    <div className="border-t border-gray-200 pt-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
            Sizes
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Same item name &amp; barcode — just different sizes, each with its
            own price and stock.
          </p>
        </div>
      </div>

      <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl mb-4">
        <input
          type="checkbox"
          checked={form.hasVariants}
          onChange={(e) => updateField("hasVariants", e.target.checked)}
          className="h-5 w-5 text-primary rounded focus:ring-primary cursor-pointer"
        />
        <div>
          <div className="font-medium text-gray-900">
            This item has multiple sizes
          </div>
          <div className="text-xs text-gray-500">
            e.g. S / M / L, or 500ml / 1L — each with its own price & stock.
          </div>
        </div>
      </label>

      {form.hasVariants && (
        <div className="space-y-3">
          {combinedWithBatches && (
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-800">
              This item is also batch-tracked, so a single batch can hold
              several sizes (e.g. one shipment with S/M/L in it). The sizes
              below are just the catalog — actual stock per size is added per
              batch through GRN, not here.
            </div>
          )}

          {errs.variants && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
              {errs.variants}
            </div>
          )}

          {variants.map((v, idx) => (
            <div
              key={idx}
              className={
                combinedWithBatches
                  ? "grid grid-cols-1 sm:grid-cols-[1.2fr_1fr_1fr_auto] gap-3 items-start p-4 border border-gray-200 rounded-xl"
                  : "grid grid-cols-1 sm:grid-cols-[1.2fr_1fr_1fr_1fr_auto] gap-3 items-start p-4 border border-gray-200 rounded-xl"
              }
            >
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">
                  Size <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. S, M, 1L"
                  className={`w-full px-3 py-2.5 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm transition-all ${
                    errs[`variant_${idx}_size`]
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300"
                  }`}
                  value={v.size}
                  onChange={(e) =>
                    updateVariantField(idx, "size", e.target.value)
                  }
                />
                {errs[`variant_${idx}_size`] && (
                  <p className="text-xs text-red-600">
                    {errs[`variant_${idx}_size`]}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">
                  Selling Price <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className={`w-full px-3 py-2.5 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm transition-all ${
                    errs[`variant_${idx}_sellingPrice`]
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300"
                  }`}
                  value={v.sellingPrice}
                  onChange={(e) =>
                    updateVariantField(idx, "sellingPrice", e.target.value)
                  }
                  onWheel={(e) => e.target.blur()}
                />
                {errs[`variant_${idx}_sellingPrice`] && (
                  <p className="text-xs text-red-600">
                    {errs[`variant_${idx}_sellingPrice`]}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700">
                  Cost Price
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className={`w-full px-3 py-2.5 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm transition-all ${
                    errs[`variant_${idx}_costPrice`]
                      ? "border-red-300 bg-red-50"
                      : "border-gray-300"
                  }`}
                  value={v.costPrice}
                  onChange={(e) =>
                    updateVariantField(idx, "costPrice", e.target.value)
                  }
                  onWheel={(e) => e.target.blur()}
                />
                {errs[`variant_${idx}_costPrice`] && (
                  <p className="text-xs text-red-600">
                    {errs[`variant_${idx}_costPrice`]}
                  </p>
                )}
              </div>

              {!combinedWithBatches && (
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700">
                    Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className={`w-full px-3 py-2.5 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm transition-all ${
                      errs[`variant_${idx}_stock`]
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                    }`}
                    value={v.stock}
                    onChange={(e) =>
                      updateVariantField(idx, "stock", e.target.value)
                    }
                    onWheel={(e) => e.target.blur()}
                  />
                  {errs[`variant_${idx}_stock`] && (
                    <p className="text-xs text-red-600">
                      {errs[`variant_${idx}_stock`]}
                    </p>
                  )}
                </div>
              )}

              <div className="flex sm:justify-end sm:pt-6">
                <button
                  type="button"
                  onClick={() => removeVariantRow(idx)}
                  disabled={variants.length === 1}
                  className="px-3 py-2.5 text-sm font-medium text-red-600 border-2 border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  title={
                    variants.length === 1
                      ? "At least one size is required"
                      : "Remove this size"
                  }
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addVariantRow}
            className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-primary border-2 border-dashed border-primary/40 rounded-xl hover:bg-primary/5 transition-all"
          >
            + Add another size
          </button>
        </div>
      )}
    </div>
  );
};

export default VariantsSection;
