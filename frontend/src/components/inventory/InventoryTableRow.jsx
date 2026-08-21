import React from "react";
import { formatCurrency } from "../../utils/currency";

const InventoryTableRow = ({
  item,
  onEdit,
  onEditStock,
  onDetails,
  onActivate,
  onDeactivate,
  onDelete,
  onPrintBarcode,
  onOpenGRN,
  currencySymbol = "Rs.",
  currencyPosition = "before",
}) => {
  const inv = item.inventory || {};
  const onHand = Number(inv.onHand || 0);
  const lowLevel = Number(inv.lowStockLevel || 0);
  const low = onHand <= lowLevel;

  return (
    <tr
      className="cursor-pointer hover:bg-gray-50/50"
      onClick={() => onDetails(item)}
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 font-medium text-gray-900">
          <span className="max-w-[180px]">{item.sku}</span>
        </div>
        <div className="flex items-center gap-2 font-medium text-gray-900">
          {item.barcode && (
            <div className="mt-1 text-xs text-gray-500 break-all">
              📟 {item.barcode}
            </div>
          )}
          {!item.isActive && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
              Inactive
            </span>
          )}
          {item.isBatchTracked && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
              Batch
            </span>
          )}
          {item.hasVariants && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 text-teal-700">
              Sizes
            </span>
          )}
          {low && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-800">
              Low
            </span>
          )}
        </div>
      </td>

      <td className="px-6 py-4">
        <span className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full">
          {item.category || "Uncategorized"}
        </span>
      </td>

      <td className="px-6 py-4">
        <span
          className={`text-sm font-bold ${
            low ? "text-red-600" : "text-gray-900"
          }`}
        >
          {onHand} {item.baseUnit}
        </span>
      </td>

      <td className="px-6 py-4">
        <span className="text-sm font-bold text-primary">
          {formatCurrency(
            Number(item.sellingPrice || 0),
            currencySymbol,
            currencyPosition,
          )}
        </span>
      </td>

      <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex items-center justify-center px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
            onClick={() => onEdit(item)}
          >
            ✏️ Edit
          </button>

          {onEditStock && (
            <button
              className="inline-flex items-center justify-center px-3 py-1.5 bg-teal-50 text-teal-700 rounded-lg cursor-pointer hover:bg-teal-100 transition-colors"
              onClick={() => onEditStock(item)}
            >
              📦 Stock
            </button>
          )}

          {item.isActive ? (
            <button
              className="inline-flex items-center justify-center px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-lg cursor-pointer hover:bg-yellow-100 transition-colors"
              onClick={() => onDeactivate(item._id)}
            >
              🔒 Deactivate
            </button>
          ) : (
            <button
              className="inline-flex items-center justify-center  px-3 py-1.5 bg-green-50 text-green-700 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
              onClick={() => onActivate(item._id)}
            >
              ✅ Activate
            </button>
          )}

          <button
            className="inline-flex items-center justify-center px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors"
            onClick={() => onOpenGRN(item)}
          >
            📥 GRN
          </button>

          <button
            className="inline-flex items-center justify-center px-3 py-1.5 bg-red-50 text-red-700 rounded-lg cursor-pointer hover:bg-red-100 transition-colors"
            onClick={() => onDelete(item._id)}
          >
            🗑️ Delete
          </button>

          <button
            className="inline-flex items-center justify-center  px-3 py-1.5 bg-green-50 text-green-700 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
            onClick={() => onPrintBarcode(item._id)}
          >
            🖨️ Barcode
          </button>
        </div>
      </td>
    </tr>
  );
};

export default InventoryTableRow;
