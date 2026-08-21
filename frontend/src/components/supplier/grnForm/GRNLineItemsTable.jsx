import React from "react";
import GRNLineItem from "./GRNLineItem";

const GRNLineItemsTable = ({
  form,
  items,
  errors,
  fieldsDisabled,
  isEditable,
  itemById,
  lineTotal,
  onLineChange,
  onAddProduct,
  onRemoveLine,
  onAddLine,
  onToggleSizeMode,
  onAddSizeLine,
  onRemoveSizeLine,
  onSizeLineChange,
}) => {
  return (
    <div className="-mt-3 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-gray-900">Items</h3>

        <button
          type="button"
          onClick={onAddLine}
          disabled={!isEditable}
          className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition"
        >
          + Add Line Item
        </button>
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold text-left text-gray-600">
                #
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-left text-gray-600">
                Item
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-left text-gray-600">
                Batch / Size
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-left text-gray-600">
                Qty
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-left text-gray-600">
                Unit Cost
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-right text-gray-600">
                Total
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-center text-gray-600">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {form.lines.map((line, index) => (
              <GRNLineItem
                key={index}
                line={line}
                lineIndex={index}
                items={items}
                errors={errors}
                fieldsDisabled={fieldsDisabled}
                itemById={itemById}
                lineTotal={lineTotal}
                onLineChange={onLineChange}
                onAddProduct={onAddProduct}
                onRemoveLine={onRemoveLine}
                isEditable={isEditable}
                linesLength={form.lines.length}
                onToggleSizeMode={onToggleSizeMode}
                onAddSizeLine={onAddSizeLine}
                onRemoveSizeLine={onRemoveSizeLine}
                onSizeLineChange={onSizeLineChange}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GRNLineItemsTable;
