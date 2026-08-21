import React, { useState } from "react";
import AppLoader from "../common/AppLoader";
import CloseButton from "../common/CloseButton";
import { SearchBar } from "../common";
import { getItemBatches } from "../../api/inventory/items";
import { formatCurrency } from "../../utils/currency";
import BarcodeScannerModal from "../../features/barcode/components/BarcodeScannerModal";

const emptyBatchModal = {
  open: false,
  item: null,
  batches: [],
  loading: false,
  error: null,
  selectedBatch: null,
  selectedSize: null, // only used when the selected batch has per-size stock
};

const POSSearchSection = ({
  api,
  query,
  setQuery,
  isSearching,
  categories,
  selectedCategory,
  setSelectedCategory,
  searchResults,
  handleSelectItem,
  barcode,
  setBarcode,
  barcodeInputRef,
  handleBarcodeSearch,
  barcodeScannedItem,
  onBarcodeScannedItemClear,
  onCameraScan,
  isTaxInvoice,
  setIsTaxInvoice,
  recalcLinesForVat,
  currencySymbol = "Rs.",
  currencyPosition = "before",
}) => {
  const [batchModal, setBatchModal] = useState(emptyBatchModal);
  const [showBillingScanner, setShowBillingScanner] = useState(false);

  const closeBatchModal = () => {
    setBatchModal(emptyBatchModal);
    onBarcodeScannedItemClear?.();
  };

  // Open batch modal and fetch batches
  const handleBatchItemClick = React.useCallback(
    async (item) => {
      setBatchModal({
        open: true,
        item,
        batches: [],
        loading: true,
        error: null,
        selectedBatch: null,
        selectedSize: null,
      });

      try {
        const data = await getItemBatches(api, item._id);
        // data.batches is the array we want
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
    },
    [api],
  );

  // Barcode scans only need a picker when the item is batch-tracked (a
  // batch must be chosen since stock is split per batch/lot). Plain items,
  // including size-variant items, are added directly by the parent — size
  // is then picked from the "Size" column in the items table.
  React.useEffect(() => {
    if (barcodeScannedItem?.isBatchTracked) {
      handleBatchItemClick(barcodeScannedItem);
    }
  }, [barcodeScannedItem, handleBatchItemClick]);

  const handleBatchSelect = (batch) => {
    setBatchModal((prev) => ({
      ...prev,
      selectedBatch: batch,
      // Switching batches resets any previously chosen size, since sizes
      // (and their stock) are specific to each batch/lot.
      selectedSize: null,
    }));
  };

  const handleBatchSizeSelect = (sizeEntry) => {
    setBatchModal((prev) => ({ ...prev, selectedSize: sizeEntry }));
  };

  // A batch that has a `sizes` array is a combined batch+size lot (item is
  // both batch-tracked AND has size variants). Picking a size here is a
  // convenience — if skipped, the cashier can still pick it afterward from
  // the "Size" column in the items table (scoped to this batch's sizes).
  const selectedBatchHasSizes =
    Array.isArray(batchModal.selectedBatch?.sizes) &&
    batchModal.selectedBatch.sizes.length > 0;

  const handleBatchConfirm = () => {
    const selected = batchModal.selectedBatch;
    if (!selected || !batchModal.item) return;

    // Prefer a size-specific selling price from the item's size catalog
    // (variants[]) when this batch is also split by size; otherwise fall
    // back to the batch's own price, then the item's base price.
    let price = Number(batchModal.item.sellingPrice) || 0;
    if (selected.sellingPrice > 0) price = Number(selected.sellingPrice);
    if (selectedBatchHasSizes && batchModal.selectedSize) {
      const catalogVariant = (batchModal.item.variants || []).find(
        (v) =>
          (v.size || "").trim().toLowerCase() ===
          (batchModal.selectedSize.size || "").trim().toLowerCase(),
      );
      if (catalogVariant && Number(catalogVariant.sellingPrice) > 0) {
        price = Number(catalogVariant.sellingPrice);
      }
    }

    const itemWithBatch = {
      ...batchModal.item,
      selectedBatch: selected,
      batchNumber: selected.batchNumber,
      batchId: selected._id,
      sellingPrice: price,
      ...(batchModal.selectedSize
        ? { selectedVariant: batchModal.selectedSize }
        : {}),
    };

    handleSelectItem(null, itemWithBatch);
    setBatchModal(emptyBatchModal);
    onBarcodeScannedItemClear?.();
  };

  // Called once the device camera decodes a barcode during billing —
  // used as a fallback when no physical scanner is plugged in.
  const handleBillingCameraScan = (value) => {
    setShowBillingScanner(false);
    onCameraScan?.(value);
  };

  return (
    <div className="p-4 border-b border-border-light sm:p-6 bg-gradient-to-r from-gray-50 to-white">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Search */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1 min-w-0">
              <label className="block mb-2 text-sm font-semibold text-text-primary">
                Search Items
              </label>
              <SearchBar
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, barcode, sku..."
                isSearching={isSearching}
              />
            </div>

            <div className="hidden w-full md:block md:w-56">
              <label className="block mb-2 text-sm font-semibold text-text-primary">
                Category
              </label>
              <div className="relative">
                <select
                  className="w-full pl-4 pr-10 text-sm text-text-primary transition-all duration-200 bg-white border-2 border-border appearance-none cursor-pointer h-11 sm:h-12 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <div className="absolute text-xs text-text-tertiary -translate-y-1/2 pointer-events-none right-3 top-1/2">
                  ▼
                </div>
              </div>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => setQuery("")}
                className="w-full px-4 text-sm font-medium text-text-secondary transition-all duration-200 bg-white border-2 border-border cursor-pointer md:w-auto h-11 sm:h-12 sm:px-6 rounded-xl hover:bg-background-subtle hover:border-border-dark active:scale-95 whitespace-nowrap"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Search Results */}
          {query && searchResults.length > 0 && (
            <div className="overflow-hidden bg-white border-2 border-border-light shadow-lg rounded-xl">
              <div className="overflow-y-auto max-h-64">
                {searchResults.map((item) => {
                  const onHand = Number(item?.inventory?.onHand || 0);
                  const isBatchTracked = !!item.isBatchTracked;
                  const hasVariants = !!item.hasVariants;

                  return (
                    <button
                      key={item._id}
                      type="button"
                      className="flex items-center justify-between w-full px-3 py-3 transition-colors duration-150 border-b border-border-light cursor-pointer sm:px-4 hover:bg-background-subtle last:border-b-0"
                      onClick={() => {
                        if (isBatchTracked) {
                          handleBatchItemClick(item);
                        } else {
                          // Plain items (including size-variant items) are
                          // added directly; size is picked afterward from
                          // the "Size" column in the items table.
                          handleSelectItem(null, item);
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                          <span className="text-sm">📦</span>
                        </div>

                        <div className="min-w-0 text-left">
                          <div className="text-sm font-medium text-text-primary break-words sm:text-base">
                            {item.sku}
                            {isBatchTracked && (
                              <span className="ml-2 px-2 py-0.5 text-xs bg-status-pending-bg text-status-pending rounded">
                                Batch
                              </span>
                            )}
                            {hasVariants && (
                              <span className="ml-2 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded">
                                Sizes
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-text-tertiary">
                            {item.category || "Uncategorized"}
                          </div>
                        </div>
                      </div>

                      <div className="flex-shrink-0 ml-2 text-right">
                        <div className="text-sm font-semibold text-text-primary">
                          {formatCurrency(
                            item.sellingPrice,
                            currencySymbol,
                            currencyPosition,
                          )}
                        </div>
                        <div className="text-xs text-text-tertiary">
                          Stock: {onHand} {item.baseUnit}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Batch Modal */}
          {batchModal.open && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/75 backdrop-blur-sm">
              {/* backdrop click */}
              <button
                type="button"
                aria-label="Close"
                className="absolute inset-0 cursor-default"
                onClick={closeBatchModal}
              />

              <div className="relative z-10 w-full max-w-md overflow-hidden bg-white shadow-2xl rounded-2xl">
                <div className="flex items-start justify-between p-5 border-b border-border-light">
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">
                      Select Batch
                    </h3>
                    <p className="mt-1 text-sm text-text-tertiary">
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
                    <div className="text-sm text-error">{batchModal.error}</div>
                  )}

                  {!batchModal.loading &&
                    !batchModal.error &&
                    batchModal.batches.length === 0 && (
                      <div className="text-sm text-text-tertiary">
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
                          // Use qtyOnHand for stock, sellingPrice for price
                          const batchOnHand = Number(batch?.qtyOnHand ?? 0);
                          const disabled = batchOnHand <= 0;
                          return (
                            <label
                              key={batch._id}
                              className={[
                                "flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition",
                                selected
                                  ? "border-primary bg-primary/10"
                                  : "border-border-light hover:bg-background-subtle",
                                disabled ? "opacity-50 cursor-not-allowed" : "",
                              ].join(" ")}
                            >
                              <input
                                type="radio"
                                name="batch"
                                value={batch._id}
                                checked={selected}
                                disabled={disabled}
                                onChange={() => handleBatchSelect(batch)}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-text-primary">
                                  Batch: {batch.batchNumber || "N/A"}
                                </div>
                                <div className="text-xs text-text-tertiary">
                                  Stock: {batchOnHand}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-semibold text-text-primary">
                                  {formatCurrency(
                                    batch.sellingPrice > 0
                                      ? Number(batch.sellingPrice)
                                      : Number(batchModal.item?.sellingPrice) ||
                                          0,
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

                  {/* This batch also has per-size stock (item is both
                      batch-tracked AND has sizes) — a size must be picked
                      from within the chosen batch before it can be sold. */}
                  {selectedBatchHasSizes && (
                    <div className="mt-4 pt-4 border-t border-border-light">
                      <div className="mb-2 text-sm font-semibold text-text-primary">
                        Select Size
                      </div>
                      <div className="space-y-2">
                        {batchModal.selectedBatch.sizes.map((sizeEntry) => {
                          const sizeSelected =
                            batchModal.selectedSize?.size === sizeEntry.size;
                          const sizeOnHand = Number(sizeEntry?.qtyOnHand ?? 0);
                          const disabled = sizeOnHand <= 0;
                          return (
                            <label
                              key={sizeEntry.size}
                              className={[
                                "flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition",
                                sizeSelected
                                  ? "border-primary bg-primary/10"
                                  : "border-border-light hover:bg-background-subtle",
                                disabled ? "opacity-50 cursor-not-allowed" : "",
                              ].join(" ")}
                            >
                              <input
                                type="radio"
                                name="batchSize"
                                value={sizeEntry.size}
                                checked={sizeSelected}
                                disabled={disabled}
                                onChange={() =>
                                  handleBatchSizeSelect(sizeEntry)
                                }
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-text-primary">
                                  Size: {sizeEntry.size}
                                </div>
                                <div className="text-xs text-text-tertiary">
                                  Stock: {sizeOnHand}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 p-5 border-t border-border-light">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-text-secondary bg-background-subtle rounded-xl hover:bg-background-disabled active:scale-95"
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

        {/* Barcode + Invoice type */}
        <div className="space-y-4">
          <div>
            <label className="block mb-2 text-sm font-semibold text-text-primary">
              Barcode Scanner
            </label>

            <form onSubmit={handleBarcodeSearch}>
              <div className="relative">
                <input
                  ref={barcodeInputRef}
                  className="w-full pl-10 pr-24 text-sm text-text-primary placeholder-gray-500 transition-all duration-200 bg-white border-2 border-border h-11 sm:h-12 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-base"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Scan barcode here"
                />
                <div className="absolute text-sm text-text-tertiary -translate-y-1/2 left-3 top-1/2">
                  📟
                </div>
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-accent text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-accent/90 active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  Add
                </button>
              </div>
            </form>

            <button
              type="button"
              onClick={() => setShowBillingScanner(true)}
              className="flex items-center justify-center w-full gap-2 px-4 mt-2 text-sm font-medium transition-all duration-200 bg-white border-2 border-border cursor-pointer h-10 sm:h-11 rounded-xl text-text-secondary hover:border-border-dark hover:bg-background-subtle active:scale-95"
            >
              📷 No scanner? Use camera
            </button>

            <p className="mt-2 text-xs text-text-tertiary">
              Focus here and scan barcode for instant item lookup, or use the
              device camera if a physical scanner isn't available.
            </p>
          </div>

          <div>
            <label className="block mb-2 text-sm font-semibold text-text-primary">
              Invoice Type
            </label>

            <div className="flex flex-col gap-2 xs:flex-row">
              <button
                type="button"
                className={[
                  "flex-1 h-10 sm:h-11 rounded-xl border-2 text-sm sm:text-base font-medium transition-all duration-200 active:scale-95",
                  !isTaxInvoice
                    ? "bg-accent text-white border-accent shadow-md"
                    : "bg-white text-text-secondary border-border hover:border-border-dark",
                ].join(" ")}
                onClick={() => {
                  setIsTaxInvoice(false);
                  recalcLinesForVat(false);
                }}
              >
                Normal Bill
              </button>

              <button
                type="button"
                className={[
                  "flex-1 h-10 sm:h-11 rounded-xl border-2 text-sm sm:text-base font-medium transition-all duration-200 active:scale-95",
                  isTaxInvoice
                    ? "bg-primary text-white border-primary shadow-md"
                    : "bg-white text-text-secondary border-border hover:border-border-dark",
                ].join(" ")}
                onClick={() => {
                  setIsTaxInvoice(true);
                  recalcLinesForVat(true);
                }}
              >
                VAT Invoice
              </button>
            </div>
          </div>
        </div>
      </div>
      {showBillingScanner && (
        <BarcodeScannerModal
          onScan={handleBillingCameraScan}
          onClose={() => setShowBillingScanner(false)}
        />
      )}
    </div>
  );
};

export default POSSearchSection;
