import React, { useState } from "react";
import { formatCurrency } from "../../../utils/currency";
import ReturnSearchBar from "./ReturnSearchBar";
import ReturnReasonSelect from "./ReturnReasonSelect";

// Same size-options helper used by ProductDetailsCard: sizes scoped to the
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

const ExchangePanel = ({
  api,
  returnedItem,
  returnQty,
  billingPrice,
  reason,
  onReasonChange,
  reasonNote,
  onReasonNoteChange,
  onSubmit,
  isSubmitting,
  errors = {},
  currencySymbol = "Rs.",
  currencyPosition = "before",
}) => {
  const [newProduct, setNewProduct] = useState(null); // { item }
  const [newVariantSize, setNewVariantSize] = useState("");
  const [newQty, setNewQty] = useState(1);
  const [newUnitPrice, setNewUnitPrice] = useState("");
  const [notFoundQuery, setNotFoundQuery] = useState("");

  const sizeOptions = getSizeOptions(newProduct?.item);
  const effectiveNewPrice = Number(newUnitPrice) || 0;

  const returnCredit = returnQty * (Number(billingPrice) || 0);
  const newItemTotal = newQty * effectiveNewPrice;
  const balance = newItemTotal - returnCredit;
  // balance > 0  → customer pays extra
  // balance < 0  → customer gets refund
  // balance === 0 → even exchange

  const needsNewSize = Boolean(newProduct?.item?.hasVariants);

  const canSubmit =
    reason &&
    newProduct &&
    effectiveNewPrice > 0 &&
    Number(billingPrice) > 0 &&
    (!needsNewSize || newVariantSize) &&
    !isSubmitting;

  const handleNewProductFound = ({ item }) => {
    setNewProduct({ item });
    setNewVariantSize("");
    setNewQty(1);
    setNewUnitPrice(String(item.sellingPrice ?? item.unitPrice ?? ""));
    setNotFoundQuery("");
  };

  // Picking a size snaps the price to that size's own price, same as the
  // returned-item card and the POS billing table.
  const handleNewVariantSizeChange = (size) => {
    setNewVariantSize(size);
    const item = newProduct?.item;
    if (!item) return;

    let price;
    if (Array.isArray(item.selectedBatch?.sizes)) {
      const catalogVariant = (item.variants || []).find(
        (v) => (v.size || "").trim().toLowerCase() === size.toLowerCase(),
      );
      if (catalogVariant && Number(catalogVariant.sellingPrice) > 0) {
        price = Number(catalogVariant.sellingPrice);
      } else if (Number(item.selectedBatch.sellingPrice) > 0) {
        price = Number(item.selectedBatch.sellingPrice);
      }
    } else {
      const variant = (item.variants || []).find(
        (v) => (v.size || "").trim().toLowerCase() === size.toLowerCase(),
      );
      if (variant && Number(variant.sellingPrice) > 0) {
        price = Number(variant.sellingPrice);
      }
    }
    if (price !== undefined) setNewUnitPrice(String(price));
  };

  const handleNewProductNotFound = (q) => {
    setNewProduct(null);
    setNotFoundQuery(q);
  };

  const handleChangeProduct = () => {
    setNewProduct(null);
    setNewVariantSize("");
    setNewQty(1);
    setNewUnitPrice("");
    setNotFoundQuery("");
  };

  return (
    <div className="space-y-4">
      {/* Reason */}
      <div className="rounded-2xl border border-gray-200 bg-background-secondary p-5 shadow-soft">
        <ReturnReasonSelect
          mode="exchange"
          value={reason}
          onChange={onReasonChange}
          note={reasonNote}
          onNoteChange={onReasonNoteChange}
          error={errors.reason}
        />
      </div>

      {/* ── Exchange With section ── */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-background-secondary shadow-soft">
        <div className="border-b border-gray-200 bg-background-subtle px-5 py-3.5">
          <p className="text-sm font-bold text-text-primary">Exchange With</p>
          <p className="text-xs text-text-tertiary mt-0.5">
            Search for the new product the customer wants
          </p>
        </div>

        <div className="px-5 py-5 space-y-5">
          {/* New product search */}
          {!newProduct ? (
            <>
              <ReturnSearchBar
                api={api}
                label=""
                onFound={handleNewProductFound}
                onNotFound={handleNewProductNotFound}
                autoFocus={false}
                currencySymbol={currencySymbol}
                currencyPosition={currencyPosition}
              />
              {notFoundQuery && (
                <div className="flex items-center gap-3 rounded-2xl border border-dashed border-error/40 bg-error-subtle px-4 py-3">
                  <span className="text-lg">🔎</span>
                  <div>
                    <p className="text-xs font-bold text-error">
                      Product Not Found
                    </p>
                    <p className="text-xs text-text-secondary mt-0.5">
                      No product matched "{notFoundQuery}". Try a different
                      code.
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Selected new product card */}
              <div className="rounded-2xl border border-primary/25 bg-primary-subtle p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg">
                      📦
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-text-primary">
                        {newProduct.item.sku}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {newProduct.item.barcode && (
                          <span className="rounded-lg bg-white/70 px-2 py-0.5 text-xs font-medium text-text-secondary">
                            Barcode: {newProduct.item.barcode}
                          </span>
                        )}
                        {newProduct.item.batchNumber && (
                          <span className="rounded-lg bg-white/70 px-2 py-0.5 text-xs font-medium text-text-secondary">
                            Batch: {newProduct.item.batchNumber}
                          </span>
                        )}
                        <span className="rounded-lg bg-white/70 px-2 py-0.5 text-xs font-medium text-text-secondary">
                          {formatCurrency(
                            newProduct.item.sellingPrice ??
                              newProduct.item.unitPrice,
                            currencySymbol,
                            currencyPosition,
                          )}{" "}
                          / {newProduct.item.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleChangeProduct}
                    className="flex-shrink-0 text-xs font-semibold text-error hover:underline cursor-pointer"
                  >
                    Change
                  </button>
                </div>

                {/* New item: size + qty + price */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {needsNewSize && (
                    <div className="col-span-2">
                      <label className="block mb-1.5 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                        Size <span className="text-error">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={newVariantSize}
                          onChange={(e) =>
                            handleNewVariantSizeChange(e.target.value)
                          }
                          className={[
                            "w-full appearance-none rounded-xl border bg-white px-3 py-2 pr-7 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer",
                            errors.newVariantSize
                              ? "border-error"
                              : "border-gray-200 focus:border-primary",
                          ].join(" ")}
                        >
                          <option value="" disabled>
                            — Select —
                          </option>
                          {(sizeOptions || []).map((opt) => (
                            <option key={opt.size} value={opt.size}>
                              {opt.size} ({opt.stock} in stock)
                            </option>
                          ))}
                        </select>
                        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-text-tertiary">
                          ▼
                        </span>
                      </div>
                      {errors.newVariantSize && (
                        <p className="mt-1 text-xs font-medium text-error">
                          {errors.newVariantSize}
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block mb-1.5 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                      Qty
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setNewQty((q) => Math.max(1, q - 1))}
                        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-base font-bold text-text-secondary hover:bg-background-subtle transition-all active:scale-95 cursor-pointer"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={newQty}
                        onChange={(e) =>
                          setNewQty(Math.max(1, Number(e.target.value) || 1))
                        }
                        onWheel={(e) => e.target.blur()}
                        className="flex-1 rounded-xl border border-gray-200 bg-white py-2 text-center text-sm font-bold text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setNewQty((q) => q + 1)}
                        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-base font-bold text-text-secondary hover:bg-background-subtle transition-all active:scale-95 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1.5 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                      Price
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-text-tertiary">
                        Rs.
                      </span>
                      <input
                        type="number"
                        min={0}
                        step="1"
                        value={newUnitPrice}
                        onChange={(e) => setNewUnitPrice(e.target.value)}
                        onWheel={(e) => e.target.blur()}
                        className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-right text-sm font-bold text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Financial breakdown ── */}
              <div className="rounded-2xl border border-gray-200 bg-background-subtle overflow-hidden">
                <div className="px-5 py-4 space-y-3 text-sm">
                  {/* Returned item row */}
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-xs text-text-tertiary uppercase tracking-wide font-semibold mb-0.5">
                        Returned Item
                      </p>
                      <p className="font-medium text-text-primary truncate">
                        {returnedItem?.sku}
                      </p>
                    </div>
                    <span className="ml-4 flex-shrink-0 font-bold text-text-primary">
                      {formatCurrency(
                        returnCredit,
                        currencySymbol,
                        currencyPosition,
                      )}
                    </span>
                  </div>

                  <div className="border-t border-gray-200" />

                  {/* New item row */}
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-xs text-text-tertiary uppercase tracking-wide font-semibold mb-0.5">
                        New Item
                      </p>
                      <p className="font-medium text-text-primary truncate">
                        {newProduct.item.sku}
                        {newVariantSize ? ` (${newVariantSize})` : ""}
                      </p>
                    </div>
                    <span className="ml-4 flex-shrink-0 font-bold text-text-primary">
                      {formatCurrency(
                        newItemTotal,
                        currencySymbol,
                        currencyPosition,
                      )}
                    </span>
                  </div>
                </div>

                {/* Balance result — prominent */}
                <div
                  className={[
                    "flex items-center justify-between px-5 py-4 border-t border-gray-200",
                    balance > 0
                      ? "bg-error-subtle"
                      : balance < 0
                        ? "bg-status-success-bg"
                        : "bg-background-subtle",
                  ].join(" ")}
                >
                  <div>
                    <p
                      className={[
                        "text-xs font-semibold uppercase tracking-wide mb-0.5",
                        balance > 0
                          ? "text-error"
                          : balance < 0
                            ? "text-status-success-text"
                            : "text-text-tertiary",
                      ].join(" ")}
                    >
                      {balance > 0
                        ? "Extra Payment"
                        : balance < 0
                          ? "Refund"
                          : "Even Exchange"}
                    </p>
                    <p className="text-xs text-text-tertiary">
                      {balance > 0
                        ? "Customer pays the difference"
                        : balance < 0
                          ? "Refund the difference to customer"
                          : "No payment needed"}
                    </p>
                  </div>
                  <span
                    className={[
                      "text-xl font-bold",
                      balance > 0
                        ? "text-error"
                        : balance < 0
                          ? "text-status-success-DEFAULT"
                          : "text-text-tertiary",
                    ].join(" ")}
                  >
                    {balance !== 0
                      ? formatCurrency(
                          Math.abs(balance),
                          currencySymbol,
                          currencyPosition,
                        )
                      : "—"}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Impact info */}
      {newProduct && (
        <div className="rounded-2xl border border-gray-200 bg-background-subtle px-5 py-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-1">
            On Confirm
          </p>
          {[
            {
              icon: "📦",
              text: `${returnedItem?.sku ?? "Returned item"} stock +${returnQty}${
                returnedItem?.hasVariants ? " (selected size)" : ""
              }`,
            },
            {
              icon: "📤",
              text: `${newProduct.item.sku} stock -${newQty}${
                newVariantSize ? ` (size ${newVariantSize})` : ""
              }`,
            },
            { icon: "💹", text: "Dashboard profit & sales updated" },
          ].map(({ icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-2 text-xs text-text-secondary"
            >
              <span>{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Submit */}
      <button
        type="button"
        onClick={() =>
          onSubmit({
            newProduct,
            newVariantSize,
            newQty,
            newUnitPrice,
            balance,
          })
        }
        disabled={!canSubmit}
        className={[
          "w-full rounded-2xl px-6 py-3.5 text-sm font-bold text-text-inverse shadow-card",
          "transition-all active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-accent/30",
          canSubmit
            ? "bg-accent hover:bg-accent-hover hover:-translate-y-0.5 hover:shadow-float cursor-pointer"
            : "bg-accent/40 cursor-not-allowed",
        ].join(" ")}
      >
        {isSubmitting ? (
          <span className="inline-flex items-center justify-center gap-2">
            <span className="inline-block h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            Processing Exchange…
          </span>
        ) : (
          "Complete Exchange"
        )}
      </button>
    </div>
  );
};

export default ExchangePanel;
