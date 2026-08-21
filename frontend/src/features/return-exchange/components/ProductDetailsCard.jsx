import React from "react";
import { formatCurrency } from "../../../utils/currency";

// Returns the size options to offer for this item: sizes scoped to the
// already-picked batch for combined batch+size items, or the item's full
// size catalog otherwise. Returns null when the item has no size variants.
const getSizeOptions = (item) => {
  if (!item?.hasVariants) return null;
  if (Array.isArray(item.selectedBatch?.sizes)) {
    return item.selectedBatch.sizes.map((s) => ({
      size: s.size,
      stock: Number(s.qtyOnHand || 0),
    }));
  }
  const variants = Array.isArray(item.variants) ? item.variants : [];
  return variants
    .filter((v) => v.isActive !== false)
    .map((v) => ({
      size: v.size,
      stock: Number(v.stock || 0),
      sellingPrice: Number(v.sellingPrice) || 0,
    }));
};

const ProductDetailsCard = ({
  heading = "Returned Product",
  item,
  billingPrice,
  onBillingPriceChange,
  returnQty,
  onReturnQtyChange,
  variantSize,
  onVariantSizeChange,
  sizeError,
  qtyLabel = "Return Qty",
  currencySymbol = "Rs.",
  currencyPosition = "before",
}) => {
  if (!item) return null;

  const effectivePrice = Number(billingPrice) || 0;
  const refundAmount = returnQty * effectivePrice;
  const maxQty = item.currentStock > 0 ? item.currentStock : 999;
  const sizeOptions = getSizeOptions(item);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-background-secondary shadow-soft">
      {/* Header */}
      <div className="border-b border-gray-200 bg-background-subtle px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary mb-0.5">
          {heading}
        </p>
      </div>

      <div className="px-5 py-5 space-y-5">
        {/* Product identity */}
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-primary-subtle text-xl">
            📦
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-text-primary">
              {item.sku}
            </h3>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {item.barcode && (
                <span className="rounded-lg bg-background-subtle px-2.5 py-0.5 text-xs font-medium text-text-secondary">
                  Barcode: {item.barcode}
                </span>
              )}
              <span className="rounded-lg bg-background-subtle px-2.5 py-0.5 text-xs font-medium text-text-secondary">
                Unit: {item.unit}
              </span>
              {item.batchNumber && (
                <span className="rounded-lg bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                  Batch: {item.batchNumber}
                </span>
              )}
              {item.vatApplicable && (
                <span className="rounded-lg bg-status-pending-bg px-2.5 py-0.5 text-xs font-semibold text-status-pending-text">
                  VAT
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Selling price stat */}
        <div className="flex items-center gap-3 rounded-2xl bg-background-subtle px-4 py-3">
          <span className="text-xs text-text-tertiary">Selling Price</span>
          <span className="ml-auto text-sm font-bold text-text-primary">
            {formatCurrency(
              item.sellingPrice ?? item.unitPrice,
              currencySymbol,
              currencyPosition,
            )}
          </span>
          <span className="text-xs text-text-tertiary">·</span>
          <span className="text-xs text-text-tertiary">
            In Stock: {item.currentStock ?? 0} {item.unit}
          </span>
        </div>

        {/* Size — required whenever this item has size variants */}
        {sizeOptions && (
          <div>
            <label className="block mb-1.5 text-xs font-semibold uppercase tracking-wide text-text-secondary">
              Size <span className="text-error">*</span>
            </label>
            <div className="relative">
              <select
                value={variantSize || ""}
                onChange={(e) => onVariantSizeChange?.(e.target.value)}
                className={[
                  "w-full appearance-none rounded-2xl border px-4 py-2.5 pr-9 text-sm shadow-soft",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer",
                  sizeError
                    ? "border-error bg-error-subtle text-text-primary"
                    : "border-gray-200 bg-background-secondary text-text-primary",
                ].join(" ")}
              >
                <option value="" disabled>
                  — Select size —
                </option>
                {sizeOptions.map((opt) => (
                  <option key={opt.size} value={opt.size}>
                    {opt.size} ({opt.stock} in stock)
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-text-tertiary">
                ▼
              </span>
            </div>
            {sizeError && (
              <p className="mt-1.5 text-xs font-medium text-error">
                {sizeError}
              </p>
            )}
          </div>
        )}

        {/* Inputs grid: Billing Price | Return Qty */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Billing price */}
          <div>
            <label className="block mb-1.5 text-xs font-semibold uppercase tracking-wide text-text-secondary">
              Billing Price <span className="text-error">*</span>
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-text-tertiary">
                Rs.
              </span>
              <input
                type="number"
                min={0}
                step="1"
                value={billingPrice}
                onChange={(e) => onBillingPriceChange(e.target.value)}
                onWheel={(e) => e.target.blur()}
                className="w-full rounded-2xl border border-gray-200 bg-background-secondary py-2.5 pl-10 pr-3 text-right text-sm font-semibold text-text-primary shadow-soft focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          {/* Return qty */}
          <div>
            <label className="block mb-1.5 text-xs font-semibold uppercase tracking-wide text-text-secondary">
              {qtyLabel} <span className="text-error">*</span>
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onReturnQtyChange(Math.max(1, returnQty - 1))}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-background-subtle text-base font-bold text-text-secondary hover:bg-background-primary hover:text-text-primary transition-all active:scale-95 cursor-pointer"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                value={returnQty}
                onChange={(e) =>
                  onReturnQtyChange(Math.max(1, Number(e.target.value) || 1))
                }
                onWheel={(e) => e.target.blur()}
                className="flex-1 rounded-2xl border border-gray-200 bg-background-secondary py-2.5 text-center text-sm font-bold text-text-primary shadow-soft focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <button
                type="button"
                onClick={() => onReturnQtyChange(returnQty + 1)}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-background-subtle text-base font-bold text-text-secondary hover:bg-background-primary hover:text-text-primary transition-all active:scale-95 cursor-pointer"
              >
                +
              </button>
            </div>
            <p className="mt-1 text-[11px] text-text-tertiary">
              In stock: {item.currentStock ?? 0}
            </p>
          </div>
        </div>

        {/* Refund preview */}
        {effectivePrice > 0 && (
          <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-background-subtle px-5 py-3">
            <div>
              <p className="text-xs text-text-tertiary">Return Credit</p>
              <p className="text-[11px] text-text-tertiary mt-0.5">
                {returnQty} ×{" "}
                {formatCurrency(
                  effectivePrice,
                  currencySymbol,
                  currencyPosition,
                )}
              </p>
            </div>
            <p className="text-lg font-bold text-status-success-DEFAULT">
              {formatCurrency(refundAmount, currencySymbol, currencyPosition)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailsCard;
