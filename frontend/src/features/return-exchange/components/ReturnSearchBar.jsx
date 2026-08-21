import React, { useState, useRef, useEffect } from "react";
import * as returnApi from "../api/returnApi";
import { getItemBatches } from "../../../api/inventory/items";
import AppLoader from "../../../components/common/AppLoader";
import CloseButton from "../../../components/common/CloseButton";
import { formatCurrency } from "../../../utils/currency";
import BarcodeScannerModal from "../../barcode/components/BarcodeScannerModal";

/**
 * ReturnSearchBar
 * Props:
 *   api          – axios instance (passed from ReturnPage)
 *   label        – section heading shown above the bar
 *   onFound      – ({ sale, item }) called on successful match
 *   onNotFound   – (query) called when no match
 *   autoFocus    – whether to focus input on mount
 */
const emptyBatchModal = {
  open: false,
  item: null,
  result: null,
  batches: [],
  loading: false,
  error: null,
  selectedBatch: null,
};

const ReturnSearchBar = ({
  api,
  label = "Scan Barcode / Enter Product Code",
  onFound,
  onNotFound,
  autoFocus = false,
  currencySymbol = "Rs.",
  currencyPosition = "before",
}) => {
  const [searchType, setSearchType] = useState("barcode");
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const [batchModal, setBatchModal] = useState(emptyBatchModal);
  const [showScanner, setShowScanner] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const runSearch = async (valueOverride) => {
    const q = (valueOverride ?? query).trim();
    if (!q) {
      setError("Please enter a value.");
      return;
    }
    setError("");
    setIsSearching(true);
    try {
      const result = await returnApi.searchProduct(api, q, searchType);
      if (result?.item?.isBatchTracked) {
        // Open batch selection before proceeding
        setBatchModal({
          open: true,
          item: result.item,
          result,
          batches: [],
          loading: true,
          error: null,
          selectedBatch: null,
        });
        try {
          const data = await getItemBatches(api, result.item._id);
          setBatchModal((prev) => ({
            ...prev,
            batches: Array.isArray(data?.batches) ? data.batches : [],
            loading: false,
          }));
        } catch {
          setBatchModal((prev) => ({
            ...prev,
            loading: false,
            error: "Failed to load batches",
          }));
        }
      } else {
        onFound?.(result);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Product not found";
      if (err?.response?.status === 404) {
        onNotFound?.(q);
      } else {
        setError(msg);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    setQuery("");
    setError("");
    inputRef.current?.focus();
  };

  // Called once the device camera decodes a barcode — used when no
  // physical scanner is connected to the till.
  const handleCameraScan = (value) => {
    setShowScanner(false);
    const trimmed = (value || "").trim();
    if (!trimmed) return;
    setSearchType("barcode");
    setQuery(trimmed);
    runSearch(trimmed);
  };

  const closeBatchModal = () => {
    setBatchModal(emptyBatchModal);
    inputRef.current?.focus();
  };

  const handleBatchConfirm = () => {
    const { selectedBatch, item, result } = batchModal;
    if (!selectedBatch || !item) return;
    const batchPrice =
      selectedBatch.sellingPrice > 0
        ? Number(selectedBatch.sellingPrice)
        : Number(item.sellingPrice) || 0;
    onFound?.({
      ...result,
      item: {
        ...item,
        selectedBatch,
        batchNumber: selectedBatch.batchNumber,
        batchId: selectedBatch._id,
        sellingPrice: batchPrice,
      },
    });
    setBatchModal(emptyBatchModal);
  };

  return (
    <div className="space-y-3">
      {label && (
        <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
          {label}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        {/* Type toggle — pill style */}
        <div className="flex rounded-xl border border-gray-200 bg-background-subtle p-1 w-fit flex-shrink-0">
          {[
            { value: "barcode", label: "📟 Barcode" },
            { value: "sku", label: "🔖 Product Code" },
          ].map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => {
                setSearchType(t.value);
                setQuery("");
                setError("");
                inputRef.current?.focus();
              }}
              className={[
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                searchType === t.value
                  ? "bg-primary text-text-inverse shadow-soft"
                  : "text-text-secondary hover:text-text-primary",
              ].join(" ")}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Input + search button */}
        <div className="flex flex-1 gap-2 min-w-0">
          <div className="relative flex-1 min-w-0">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary text-sm">
              {searchType === "barcode" ? "📟" : "🔍"}
            </span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (error) setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && runSearch()}
              placeholder={
                searchType === "barcode"
                  ? "Scan or type barcode…"
                  : "e.g. PVC-001"
              }
              className={[
                "w-full rounded-2xl border py-2.5 pl-10 pr-9 text-sm text-text-primary shadow-soft",
                "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all",
                error
                  ? "border-error bg-error-subtle"
                  : "border-gray-200 bg-background-secondary",
              ].join(" ")}
            />
            {query && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => runSearch()}
            disabled={isSearching}
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-text-inverse shadow-soft hover:bg-primary-hover hover:-translate-y-0.5 hover:shadow-card active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSearching ? (
              <>
                <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                Searching…
              </>
            ) : (
              "Search"
            )}
          </button>

          {searchType === "barcode" && (
            <button
              type="button"
              onClick={() => setShowScanner(true)}
              title="No scanner? Use device camera"
              className="inline-flex items-center gap-2 rounded-2xl border-2 border-gray-200 bg-background-secondary px-4 py-2.5 text-sm font-semibold text-text-secondary shadow-soft hover:border-gray-300 hover:text-text-primary active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
            >
              📷 Camera
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-xs font-medium text-error">{error}</p>}

      {showScanner && (
        <BarcodeScannerModal
          onScan={handleCameraScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Batch Selection Modal */}
      {batchModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/75 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 cursor-default"
            onClick={closeBatchModal}
          />
          <div className="relative z-10 w-full max-w-md overflow-hidden bg-white shadow-2xl rounded-2xl">
            <div className="flex items-start justify-between p-5 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Select Batch
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {batchModal.item?.sku}
                </p>
              </div>
              <CloseButton
                onClick={closeBatchModal}
                size="md"
                ariaLabel="Close batch modal"
              />
            </div>
            <div className="p-5">
              {batchModal.loading && (
                <div className="flex justify-center items-center py-4">
                  <AppLoader
                    open
                    variant="inline"
                    title="Loading batches"
                    subtitle="Checking batch availability"
                  />
                </div>
              )}
              {batchModal.error && (
                <div className="text-sm text-red-600">{batchModal.error}</div>
              )}
              {!batchModal.loading &&
                !batchModal.error &&
                batchModal.batches.length === 0 && (
                  <div className="text-sm text-gray-500">
                    No batches found for this item.
                  </div>
                )}
              {!batchModal.loading &&
                !batchModal.error &&
                batchModal.batches.length > 0 && (
                  <div className="pr-1 space-y-2 overflow-y-auto max-h-56">
                    {batchModal.batches.map((batch) => {
                      const selected =
                        batchModal.selectedBatch?._id === batch._id;
                      const batchOnHand = Number(batch?.qtyOnHand ?? 0);
                      const disabled = batchOnHand <= 0;
                      return (
                        <label
                          key={batch._id}
                          className={[
                            "flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition",
                            selected
                              ? "border-primary bg-primary/10"
                              : "border-gray-200 hover:bg-gray-50",
                            disabled ? "opacity-50 cursor-not-allowed" : "",
                          ].join(" ")}
                        >
                          <input
                            type="radio"
                            name="return-batch"
                            value={batch._id}
                            checked={selected}
                            disabled={disabled}
                            onChange={() =>
                              setBatchModal((prev) => ({
                                ...prev,
                                selectedBatch: batch,
                              }))
                            }
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900">
                              Batch: {batch.batchNumber || "N/A"}
                            </div>
                            <div className="text-xs text-gray-500">
                              Stock: {batchOnHand}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-gray-900">
                              {formatCurrency(
                                batch.sellingPrice > 0
                                  ? Number(batch.sellingPrice)
                                  : Number(batchModal.item?.sellingPrice) || 0,
                                currencySymbol,
                                currencyPosition,
                              )}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-gray-100">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 active:scale-95"
                onClick={closeBatchModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-white rounded-xl bg-primary hover:bg-primary/90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleBatchConfirm}
                disabled={!batchModal.selectedBatch}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnSearchBar;
