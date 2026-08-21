import React, { useState, useEffect } from "react";
import AppLoader from "../common/AppLoader";
import CloseButton from "../common/CloseButton";
import { showError, errorMessages } from "../../utils/toastHelper";
import { getItemBatches } from "../../api/inventory/items";

const ItemDetailModal = ({ api, item, open, onClose, onEdit, onEditStock }) => {
  const [batches, setBatches] = useState([]);
  const [batchesLoading, setBatchesLoading] = useState(false);

  useEffect(() => {
    if (!open || !item) return;

    const fetchBatches = async () => {
      if (!item?.isBatchTracked) return;

      try {
        setBatchesLoading(true);
        const data = await getItemBatches(api, item._id);
        setBatches(data?.batches || []);
      } catch (err) {
        showError(
          err?.response?.data?.message || errorMessages.load("batches"),
        );
      } finally {
        setBatchesLoading(false);
      }
    };

    fetchBatches();
  }, [open, item]);

  if (!open || !item) return null;

  const inv = item.inventory || {};
  const onHand = Number(inv.onHand || 0);
  const reserved = Number(inv.reserved || 0);
  const low = Number(inv.lowStockLevel || 0);
  const openingStock = Number(item.openingStock ?? inv.onHand ?? 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-3 bg-white/75 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-gray-200">
        {/* Header */}
        <div className="sticky top-0 p-5 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-gray-900">{item.sku}</h3>
              <p className="text-xs text-gray-600 break-all">
                {item.barcode || "No barcode"}
              </p>
            </div>
            <CloseButton
              onClick={onClose}
              size="sm"
              ariaLabel="Close item details"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Basic Info */}
            <div>
              <h4 className="text-xs font-semibold text-gray-700 uppercase">
                Basic
              </h4>
              <div className="mt-2 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-gray-600">Category</span>
                  <span className="font-medium text-gray-900">
                    {item.category || "Uncategorized"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-600">Base Unit</span>
                  <span className="font-medium text-gray-900">
                    {item.baseUnit}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-600">Status</span>
                  <span className="font-medium text-gray-900">
                    {item.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>

            {/* Stock Info */}
            <div>
              <h4 className="text-xs font-semibold text-gray-700 uppercase">
                Stock
              </h4>
              <div className="mt-2 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-gray-600">On-hand</span>
                  <span className="font-bold text-gray-900">
                    {onHand} {item.baseUnit}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-600">Opening Stock</span>
                  <span className="font-medium text-gray-900">
                    {openingStock} {item.baseUnit}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-600">Reserved</span>
                  <span className="font-medium text-gray-900">
                    {reserved} {item.baseUnit}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-600">Low Level</span>
                  <span className="font-medium text-gray-900">{low}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Batches */}
          {item.isBatchTracked && (
            <div>
              <h4 className="text-xs font-semibold text-gray-700 uppercase">
                Batches
              </h4>
              <div className="mt-3 overflow-hidden border border-gray-200 rounded-xl">
                {batchesLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <AppLoader
                      open
                      variant="inline"
                      title="Loading batches"
                      subtitle="Fetching batch availability"
                    />
                  </div>
                ) : batches.length === 0 ? (
                  <div className="p-4 text-sm text-gray-600">
                    No batches found.
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-xs font-semibold text-left text-gray-600">
                          Batch
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold text-left text-gray-600">
                          Expiry
                        </th>
                        {item.hasVariants && (
                          <th className="px-4 py-3 text-xs font-semibold text-left text-gray-600">
                            Sizes
                          </th>
                        )}
                        <th className="px-4 py-3 text-xs font-semibold text-right text-gray-600">
                          On-hand
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold text-right text-gray-600">
                          Reserved
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold text-right text-gray-600">
                          Available
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {batches.map((b) => (
                        <tr key={b._id}>
                          <td className="px-4 py-3">{b.batchNumber || "-"}</td>
                          <td className="px-4 py-3">
                            {b.expiryDate
                              ? new Date(b.expiryDate)
                                  .toISOString()
                                  .slice(0, 10)
                              : "-"}
                          </td>
                          {item.hasVariants && (
                            <td className="px-4 py-3">
                              {Array.isArray(b.sizes) && b.sizes.length ? (
                                <div className="flex flex-wrap gap-1">
                                  {b.sizes.map((s) => (
                                    <span
                                      key={s.size}
                                      className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-xs text-gray-700"
                                    >
                                      {s.size}: {Number(s.qtyOnHand || 0)}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                "-"
                              )}
                            </td>
                          )}
                          <td className="px-4 py-3 text-right">
                            {Number(b.qtyOnHand || 0)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {Number(b.reserved || 0)}
                          </td>
                          <td className="px-4 py-3 font-semibold text-right">
                            {Number(b.available || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 p-5 bg-white border-t border-gray-200">
          <div className="flex justify-end gap-3">
            <button
              className="inline-flex items-center justify-center gap-2 px-6 py-3 transition-all border-2 border-gray-300 cursor-pointer rounded-xl hover:bg-gray-50 active:scale-95"
              onClick={onClose}
            >
              ✕ Close
            </button>
            {onEditStock && (
              <button
                className="inline-flex items-center justify-center gap-2 px-6 py-3 transition-all border-2 border-primary text-primary cursor-pointer rounded-xl hover:bg-primary-subtle active:scale-95"
                onClick={() => {
                  onEditStock(item);
                  onClose();
                }}
              >
                📦 Edit Stock
              </button>
            )}
            <button
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-white transition-all cursor-pointer bg-gradient-to-r from-primary to-primary/90 rounded-xl hover:shadow-lg active:scale-95"
              onClick={() => {
                onEdit(item);
                onClose();
              }}
            >
              ✏️ Edit Item
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetailModal;
