import React from "react";
import { EmptyState, ActionButton } from "../common";
import EntityCardList from "../common/EntityCardList";

const InventoryMobileCard = ({
  items,
  onDetails,
  onEditStock,
  onAddNew,
  onOpenGRN,
  lowStockOnly,
}) => {
  const renderCard = (item) => {
    const inv = item.inventory || {};
    const onHand = Number(inv.onHand || 0);
    const lowLevel = Number(inv.lowStockLevel || 0);
    const low = onHand <= lowLevel;

    return (
      <div
        className="border border-gray-200 rounded-xl shadow-sm bg-white p-4"
        onClick={() => onDetails(item)}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-semibold text-gray-900 text-sm">
              {item.sku}
            </div>
            {item.barcode && (
              <div className="text-[11px] text-gray-500 break-all">
                📟 {item.barcode}
              </div>
            )}
            <div className="text-[11px] text-gray-500">
              Stock:{" "}
              <span
                className={`font-bold ${
                  low ? "text-red-600" : "text-gray-900"
                }`}
              >
                {onHand} {item.baseUnit}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {!item.isActive && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-200">
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
        </div>

        {(onOpenGRN || onEditStock) && (
          <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
            {onEditStock && (
              <button
                className="inline-flex items-center justify-center flex-1 px-3 py-1.5 text-xs bg-teal-50 text-teal-700 rounded-lg cursor-pointer hover:bg-teal-100 transition-colors"
                onClick={() => onEditStock(item)}
              >
                📦 Stock
              </button>
            )}
            {onOpenGRN && (
              <button
                className="inline-flex items-center justify-center flex-1 px-3 py-1.5 text-xs bg-purple-50 text-purple-700 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors"
                onClick={() => onOpenGRN(item)}
              >
                📥 GRN
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const emptyState = (
    <div className="px-4 py-10">
      <EmptyState
        icon="📦"
        title="No items found"
        description={
          lowStockOnly
            ? "No low stock items"
            : "Try adjusting your search or filters"
        }
        action={
          <ActionButton label="+ Add Your First Item" onClick={onAddNew} />
        }
      />
    </div>
  );

  return (
    <div className="block lg:hidden">
      <EntityCardList
        items={items}
        renderCard={renderCard}
        emptyState={emptyState}
      />
    </div>
  );
};

export default InventoryMobileCard;
