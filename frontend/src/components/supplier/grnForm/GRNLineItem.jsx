import React from "react";
import { formatCurrency } from "../../../utils/currency";

const GRNLineItem = ({
  line,
  lineIndex,
  items,
  errors,
  fieldsDisabled,
  itemById,
  lineTotal,
  onLineChange,
  onAddProduct,
  onRemoveLine,
  linesLength,
  currencySymbol = "",
  currencyPosition = "before",
  onToggleSizeMode,
  onAddSizeLine,
  onRemoveSizeLine,
  onSizeLineChange,
}) => {
  const it = line.item ? itemById.get(String(line.item)) : null;
  const isBatchTracked = Boolean(it?.isBatchTracked);
  const hasVariants = Boolean(it?.hasVariants);
  const variantOptions = (it?.variants || []).filter(
    (v) => v.isActive !== false,
  );
  // Batch + sizes together -> the batch can be split across multiple sizes
  // (a shipment/lot of S/M/L in one batch number).
  const canUseSizeMode = isBatchTracked && hasVariants;
  const sizeMode = canUseSizeMode && Boolean(line.sizeMode);
  const sizeLines = line.sizeLines || [];

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 text-sm text-gray-600">{lineIndex + 1}</td>

      <td className="px-4 py-3">
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <select
              name="item"
              value={line.item}
              onChange={(e) => onLineChange(lineIndex, e)}
              disabled={fieldsDisabled}
              className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                errors[`line_${lineIndex}_item`]
                  ? "border-red-300 bg-red-50"
                  : "border-gray-200"
              }`}
            >
              <option value="">-- Select Item --</option>
              {items
                .filter((x) => x.isActive !== false)
                .map((it) => (
                  <option key={it._id} value={it._id}>
                    {it.sku}
                  </option>
                ))}
            </select>
            {errors[`line_${lineIndex}_item`] && (
              <p className="mt-1 text-xs text-red-600">
                {errors[`line_${lineIndex}_item`]}
              </p>
            )}

            {it?.isBatchTracked && !it?.hasVariants && (
              <p className="text-[11px] text-gray-500 mt-1">
                Batch tracked (batch number required)
              </p>
            )}
            {it?.hasVariants && !it?.isBatchTracked && (
              <p className="text-[11px] text-gray-500 mt-1">
                Has sizes (pick a size to add its stock)
              </p>
            )}
            {it?.isBatchTracked && it?.hasVariants && (
              <p className="text-[11px] text-gray-500 mt-1">
                Batch + sizes — enter the batch number and pick the size this
                line is for.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => onAddProduct(lineIndex)}
            disabled={fieldsDisabled}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-primary/10 text-primary hover:bg-primary/15"
            title="Add new item"
          >
            + New
          </button>
        </div>
      </td>

      <td className="px-4 py-3 align-top">
        <div className="space-y-2">
          {isBatchTracked && (
            <div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  name="batchNumber"
                  value={line.batchNumber}
                  onChange={(e) => onLineChange(lineIndex, e)}
                  disabled={fieldsDisabled}
                  className={`flex-1 px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                    errors[`line_${lineIndex}_batchNumber`]
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200"
                  }`}
                  placeholder="Batch number"
                />

                {canUseSizeMode && (
                  <button
                    type="button"
                    onClick={() => onToggleSizeMode(lineIndex)}
                    disabled={fieldsDisabled}
                    title="Add multiple sizes to this batch"
                    className={`shrink-0 px-2.5 py-2 text-xs font-semibold rounded-lg border transition ${
                      sizeMode
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {sizeMode ? "✓ Sizes" : "+ Sizes"}
                  </button>
                )}
              </div>
              {errors[`line_${lineIndex}_batchNumber`] && (
                <p className="mt-1 text-xs text-red-600">
                  {errors[`line_${lineIndex}_batchNumber`]}
                </p>
              )}
            </div>
          )}

          {hasVariants && !sizeMode && (
            <div>
              <select
                name="variantSize"
                value={line.variantSize}
                onChange={(e) => onLineChange(lineIndex, e)}
                disabled={fieldsDisabled}
                className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                  errors[`line_${lineIndex}_variantSize`]
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200"
                }`}
              >
                <option value="">-- Select Size --</option>
                {variantOptions.map((v) => (
                  <option key={v._id || v.size} value={v.size}>
                    {v.size}
                    {!isBatchTracked && (v.stock === 0 || v.stock)
                      ? ` (stock: ${v.stock})`
                      : ""}
                  </option>
                ))}
              </select>
              {errors[`line_${lineIndex}_variantSize`] && (
                <p className="mt-1 text-xs text-red-600">
                  {errors[`line_${lineIndex}_variantSize`]}
                </p>
              )}
              {isBatchTracked && canUseSizeMode && (
                <p className="text-[11px] text-gray-500 mt-1">
                  One size per line, or click{" "}
                  <span className="font-semibold">+ Sizes</span> above to enter
                  several sizes for this same batch at once.
                </p>
              )}
            </div>
          )}

          {sizeMode && (
            <div className="space-y-2 border border-gray-200 rounded-lg p-2 bg-gray-50">
              {sizeLines.map((row, sizeIdx) => (
                <div key={sizeIdx} className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <select
                      name="size"
                      value={row.size}
                      onChange={(e) => onSizeLineChange(lineIndex, sizeIdx, e)}
                      disabled={fieldsDisabled}
                      className={`min-w-0 flex-[1.2] px-2 py-1.5 border rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                        errors[`line_${lineIndex}_size_${sizeIdx}_size`]
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <option value="">-- Size --</option>
                      {variantOptions.map((v) => (
                        <option key={v._id || v.size} value={v.size}>
                          {v.size}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      name="qty"
                      min="0"
                      step="1"
                      value={row.qty}
                      onChange={(e) => onSizeLineChange(lineIndex, sizeIdx, e)}
                      onWheel={(e) => e.target.blur()}
                      disabled={fieldsDisabled}
                      placeholder="Qty"
                      className={`min-w-0 flex-1 px-2 py-1.5 border rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                        errors[`line_${lineIndex}_size_${sizeIdx}_qty`]
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200 bg-white"
                      }`}
                    />

                    <input
                      type="number"
                      name="unitCost"
                      min="0"
                      step="1"
                      value={row.unitCost}
                      onChange={(e) => onSizeLineChange(lineIndex, sizeIdx, e)}
                      onWheel={(e) => e.target.blur()}
                      disabled={fieldsDisabled}
                      placeholder="Price"
                      className={`min-w-0 flex-1 px-2 py-1.5 border rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                        errors[`line_${lineIndex}_size_${sizeIdx}_unitCost`]
                          ? "border-red-300 bg-red-50"
                          : "border-gray-200 bg-white"
                      }`}
                    />

                    <button
                      type="button"
                      onClick={() => onRemoveSizeLine(lineIndex, sizeIdx)}
                      disabled={fieldsDisabled || sizeLines.length === 1}
                      title="Remove size"
                      className="shrink-0 px-1.5 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      ✕
                    </button>
                  </div>
                  {(errors[`line_${lineIndex}_size_${sizeIdx}_size`] ||
                    errors[`line_${lineIndex}_size_${sizeIdx}_qty`] ||
                    errors[`line_${lineIndex}_size_${sizeIdx}_unitCost`]) && (
                    <p className="text-[11px] text-red-600">
                      {errors[`line_${lineIndex}_size_${sizeIdx}_size`] ||
                        errors[`line_${lineIndex}_size_${sizeIdx}_qty`] ||
                        errors[`line_${lineIndex}_size_${sizeIdx}_unitCost`]}
                    </p>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={() => onAddSizeLine(lineIndex)}
                disabled={fieldsDisabled}
                className="w-full px-2 py-1.5 text-xs font-medium text-primary bg-primary/5 hover:bg-primary/10 rounded"
              >
                + Add another size
              </button>
              <p className="text-[11px] text-gray-500">
                All sizes above will be received into batch{" "}
                <span className="font-semibold">
                  {line.batchNumber?.trim() || "(enter batch number)"}
                </span>
                , each with its own qty and price.
              </p>
            </div>
          )}

          {!isBatchTracked && !hasVariants && (
            <input
              type="text"
              value="N/A"
              disabled
              className="w-full px-3 py-2 border rounded text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
            />
          )}
        </div>
      </td>

      <td className="px-4 py-3 align-top">
        {sizeMode ? (
          <div className="px-3 py-2 text-xs text-gray-400 italic">
            Set per size
          </div>
        ) : (
          <>
            <input
              type="number"
              name="qty"
              min="0"
              step="1"
              value={line.qty}
              onChange={(e) => onLineChange(lineIndex, e)}
              onWheel={(e) => e.target.blur()}
              disabled={fieldsDisabled}
              className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                errors[`line_${lineIndex}_qty`]
                  ? "border-red-300 bg-red-50"
                  : "border-gray-200"
              }`}
              placeholder="0"
            />
            {errors[`line_${lineIndex}_qty`] && (
              <p className="mt-1 text-xs text-red-600">
                {errors[`line_${lineIndex}_qty`]}
              </p>
            )}
          </>
        )}
      </td>

      <td className="px-4 py-3 align-top">
        {sizeMode ? (
          <div className="px-3 py-2 text-xs text-gray-400 italic">
            Set per size
          </div>
        ) : (
          <>
            <input
              type="number"
              name="unitCost"
              min="0"
              step="1"
              value={line.unitCost}
              onChange={(e) => onLineChange(lineIndex, e)}
              onWheel={(e) => e.target.blur()}
              disabled={fieldsDisabled}
              className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                errors[`line_${lineIndex}_unitCost`]
                  ? "border-red-300 bg-red-50"
                  : "border-gray-200"
              }`}
              placeholder="0.00"
            />
            {errors[`line_${lineIndex}_unitCost`] && (
              <p className="mt-1 text-xs text-red-600">
                {errors[`line_${lineIndex}_unitCost`]}
              </p>
            )}
          </>
        )}
      </td>

      <td className="px-4 py-3 text-sm font-medium text-right text-gray-900">
        {formatCurrency(lineTotal(line), currencySymbol, currencyPosition)}
      </td>

      <td className="px-4 py-3 text-center">
        <button
          type="button"
          onClick={() => onRemoveLine(lineIndex)}
          disabled={linesLength === 1 || fieldsDisabled}
          className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Remove
        </button>
      </td>
    </tr>
  );
};

export default GRNLineItem;
