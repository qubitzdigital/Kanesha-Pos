import React, { useEffect, useMemo, useState } from "react";
import AppLoader from "../common/AppLoader";
import CloseButton from "../common/CloseButton";
import { showSuccess, showError, errorMessages } from "../../utils/toastHelper";
import { getItemBatches, setItemStock } from "../../api/inventory/items";

/**
 * EditStockModal
 *
 * Lets a user manually correct stock quantities from the Inventory list.
 *
 *  - Batch-tracked item        -> pick a batch first.
 *      - Item also has sizes   -> edit stock per size, within that batch.
 *      - No sizes               -> edit that batch's stock as one number.
 *  - Not batch-tracked, sized  -> edit stock per size directly (no batch step).
 *  - Plain item                -> edit stock as one number.
 *
 * Every save goes through PATCH /items/:id/stock, which records a normal
 * "adjustment" stock movement (same history trail as GRN/sales/returns).
 */
const EditStockModal = ({ api, item, open, onClose, onSuccess }) => {
  const [batches, setBatches] = useState([]);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState(null);

  // size -> string qty being edited (used both for batch+sizes and sizes-only modes)
  const [sizeQtys, setSizeQtys] = useState({});
  // single-number qty being edited (used for batch-only and plain modes)
  const [singleQty, setSingleQty] = useState("");

  const [savingKey, setSavingKey] = useState(null); // which row/section is saving
  const [note, setNote] = useState("");

  const isBatchTracked = Boolean(item?.isBatchTracked);
  const hasVariants = Boolean(item?.hasVariants);
  const needsBatchStep = isBatchTracked;

  const selectedBatch = useMemo(
    () =>
      batches.find((b) => String(b._id) === String(selectedBatchId)) || null,
    [batches, selectedBatchId],
  );

  const sizeCatalog = useMemo(
    () => (Array.isArray(item?.variants) ? item.variants : []),
    [item],
  );

  const resetSelection = () => {
    setSelectedBatchId(null);
    setSizeQtys({});
    setSingleQty("");
    setNote("");
  };

  // Load batches (if applicable) whenever the modal opens for an item
  useEffect(() => {
    if (!open || !item) return;
    resetSelection();

    if (!isBatchTracked) {
      // No batch step: seed edit state directly from the item.
      if (hasVariants) {
        const seed = {};
        sizeCatalog.forEach((v) => {
          seed[v.size] = String(v.stock ?? 0);
        });
        setSizeQtys(seed);
      } else {
        setSingleQty(String(item?.inventory?.onHand ?? 0));
      }
      return;
    }

    const fetchBatches = async () => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item]);

  // When a batch is picked, seed the edit fields from that batch
  useEffect(() => {
    if (!selectedBatch) return;

    if (hasVariants) {
      const seed = {};
      sizeCatalog.forEach((v) => {
        const entry = (selectedBatch.sizes || []).find(
          (s) => s.size === v.size,
        );
        seed[v.size] = String(entry ? entry.qtyOnHand : 0);
      });
      setSizeQtys(seed);
    } else {
      setSingleQty(String(selectedBatch.qtyOnHand ?? 0));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBatch]);

  const refreshBatches = async () => {
    if (!isBatchTracked || !item) return;
    try {
      const data = await getItemBatches(api, item._id);
      setBatches(data?.batches || []);
    } catch {
      // non-fatal; table refresh (onSuccess) still keeps things accurate
    }
  };

  const handleSaveSize = async (size) => {
    const raw = sizeQtys[size];
    if (raw === "" || raw === undefined || Number.isNaN(Number(raw))) {
      showError("Enter a valid quantity");
      return;
    }
    const qty = Number(raw);
    if (qty < 0) {
      showError("Quantity cannot be negative");
      return;
    }

    const key = `size:${size}`;
    setSavingKey(key);
    try {
      await setItemStock(api, item._id, {
        qty,
        batchId: needsBatchStep ? selectedBatchId : undefined,
        size,
        note: note || undefined,
      });
      showSuccess(`Stock updated for size "${size}"`);
      await refreshBatches();
      if (onSuccess) await onSuccess();
    } catch (err) {
      showError(err?.response?.data?.message || errorMessages.save("stock"));
    } finally {
      setSavingKey(null);
    }
  };

  const handleSaveSingle = async () => {
    if (singleQty === "" || Number.isNaN(Number(singleQty))) {
      showError("Enter a valid quantity");
      return;
    }
    const qty = Number(singleQty);
    if (qty < 0) {
      showError("Quantity cannot be negative");
      return;
    }

    const key = "single";
    setSavingKey(key);
    try {
      await setItemStock(api, item._id, {
        qty,
        batchId: needsBatchStep ? selectedBatchId : undefined,
        note: note || undefined,
      });
      showSuccess("Stock updated");
      await refreshBatches();
      if (onSuccess) await onSuccess();
    } catch (err) {
      showError(err?.response?.data?.message || errorMessages.save("stock"));
    } finally {
      setSavingKey(null);
    }
  };

  if (!open || !item) return null;

  const showEditor = !needsBatchStep || Boolean(selectedBatch);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-3 bg-white/75 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-gray-200">
        {/* Header */}
        <div className="sticky top-0 z-10 p-5 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                📦 Edit Stock — {item.name}
              </h3>
              <p className="text-xs text-gray-600 break-all">
                {item.sku} {item.barcode ? `• ${item.barcode}` : ""}
              </p>
            </div>
            <CloseButton
              onClick={onClose}
              size="sm"
              ariaLabel="Close edit stock"
            />
          </div>
        </div>

        <div className="p-5 space-y-6">
          {/* Step 1: choose a batch (only for batch-tracked items) */}
          {needsBatchStep && (
            <div>
              <h4 className="text-xs font-semibold text-gray-700 uppercase">
                Select Batch
              </h4>

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
                <div className="p-4 mt-2 text-sm text-gray-600 border border-gray-200 rounded-xl">
                  No batches found for this item. Receive stock via GRN first.
                </div>
              ) : (
                <div className="mt-2 space-y-2">
                  {batches.map((b) => {
                    const active = String(b._id) === String(selectedBatchId);
                    return (
                      <button
                        key={b._id}
                        type="button"
                        onClick={() => setSelectedBatchId(b._id)}
                        className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-left transition-colors cursor-pointer ${
                          active
                            ? "border-primary bg-primary-subtle"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {b.batchNumber || "-"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {b.expiryDate
                              ? `Expires ${new Date(b.expiryDate)
                                  .toISOString()
                                  .slice(0, 10)}`
                              : "No expiry"}
                          </div>
                        </div>
                        <div className="text-sm font-bold text-gray-900">
                          {Number(b.qtyOnHand || 0)} {item.baseUnit}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step 2: edit the stock (per size, or as a single number) */}
          {showEditor && (
            <div>
              <h4 className="text-xs font-semibold text-gray-700 uppercase">
                {hasVariants ? "Edit Stock by Size" : "Edit Stock"}
                {needsBatchStep && selectedBatch
                  ? ` — Batch ${selectedBatch.batchNumber}`
                  : ""}
              </h4>

              {hasVariants ? (
                sizeCatalog.length === 0 ? (
                  <div className="p-4 mt-2 text-sm text-gray-600 border border-gray-200 rounded-xl">
                    This item has no sizes configured yet.
                  </div>
                ) : (
                  <div className="mt-3 overflow-hidden border border-gray-200 rounded-xl">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-xs font-semibold text-left text-gray-600">
                            Size
                          </th>
                          <th className="px-4 py-3 text-xs font-semibold text-left text-gray-600">
                            Stock
                          </th>
                          <th className="px-4 py-3 text-xs font-semibold text-right text-gray-600">
                            &nbsp;
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {sizeCatalog.map((v) => {
                          const key = `size:${v.size}`;
                          const saving = savingKey === key;
                          return (
                            <tr key={v.size}>
                              <td className="px-4 py-3 font-medium text-gray-900">
                                {v.size}
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                                  value={sizeQtys[v.size] ?? ""}
                                  onChange={(e) =>
                                    setSizeQtys((p) => ({
                                      ...p,
                                      [v.size]: e.target.value,
                                    }))
                                  }
                                />
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() => handleSaveSize(v.size)}
                                  className="inline-flex items-center justify-center px-3 py-1.5 bg-primary text-white rounded-lg cursor-pointer hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                >
                                  {saving ? "Saving…" : "Save"}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                <div className="flex items-end gap-3 mt-3">
                  <div>
                    <label className="block mb-1 text-xs text-gray-600">
                      Stock ({item.baseUnit})
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className="w-40 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                      value={singleQty}
                      onChange={(e) => setSingleQty(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    disabled={savingKey === "single"}
                    onClick={handleSaveSingle}
                    className="inline-flex items-center justify-center px-4 py-2 bg-primary text-white rounded-lg cursor-pointer hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {savingKey === "single" ? "Saving…" : "Save"}
                  </button>
                </div>
              )}

              {/* Optional note, applied to whichever save button is used next */}
              <div className="mt-4">
                <label className="block mb-1 text-xs text-gray-600">
                  Note (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Stock count correction"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditStockModal;
