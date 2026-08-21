import React, { useState, useCallback } from "react";
import PageHeader from "../../../components/common/PageHeader";
import ReturnSearchBar from "../components/ReturnSearchBar";
import ProductDetailsCard from "../components/ProductDetailsCard";
import ReturnForm from "../components/ReturnForm";
import ExchangePanel from "../components/ExchangePanel";
import { mapReturnData, mapExchangeData } from "../utils/mapReturnData";
import { showSuccess } from "../../../utils/toastHelper";

import * as returnApi from "../api/returnApi";

// ─── Steps ───────────────────────────────────────────────────────────────────
// STEP 1 → Scan / search returned product
// STEP 2 → Fill details (billing price, qty) + reason + process
// ─────────────────────────────────────────────────────────────────────────────
const STEP = { SEARCH: 1, DETAILS: 2 };

// ─── Step indicator ───────────────────────────────────────────────────────────
const StepIndicator = ({ current, mode }) => {
  const steps =
    mode === "return"
      ? [
          { id: 1, label: "Find Product" },
          { id: 2, label: "Return Details" },
        ]
      : [
          { id: 1, label: "Find Product" },
          { id: 2, label: "Exchange Details" },
        ];

  return (
    <div className="flex items-center gap-0">
      {steps.map((s, i) => {
        const done = current > s.id;
        const active = current === s.id;
        return (
          <React.Fragment key={s.id}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={[
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all",
                  done
                    ? "bg-status-success-DEFAULT text-white"
                    : active
                      ? "bg-primary text-white shadow-card"
                      : "border border-gray-200 bg-background-subtle text-text-tertiary",
                ].join(" ")}
              >
                {done ? "✓" : s.id}
              </div>
              <span
                className={`text-[10px] font-semibold whitespace-nowrap ${
                  active
                    ? "text-primary"
                    : done
                      ? "text-status-success-DEFAULT"
                      : "text-text-tertiary"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`h-0.5 w-12 sm:w-20 mb-4 mx-1.5 transition-all ${
                  current > s.id ? "bg-status-success-DEFAULT" : "bg-gray-200"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────
const ReturnPage = ({ api }) => {
  // `api` = axios instance from createApiClient
  const [mode, setMode] = useState("return");
  const [step, setStep] = useState(STEP.SEARCH);

  const [foundItem, setFoundItem] = useState(null);
  const [notFoundQuery, setNotFoundQuery] = useState("");

  const [billingPrice, setBillingPrice] = useState("");
  const [returnQty, setReturnQty] = useState(1);
  // Size of the returned item — only relevant when foundItem.hasVariants
  const [variantSize, setVariantSize] = useState("");

  const [reason, setReason] = useState("");
  const [reasonNote, setReasonNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // ── Helpers ────────────────────────────────────────────────────────────────

  const resetAll = useCallback((keepMode = false) => {
    if (!keepMode) setMode("return");
    setStep(STEP.SEARCH);
    setFoundItem(null);
    setNotFoundQuery("");
    setBillingPrice("");
    setReturnQty(1);
    setVariantSize("");
    setReason("");
    setReasonNote("");
    setErrors({});
  }, []);

  const handleTabChange = (newMode) => {
    setMode(newMode);
    setStep(STEP.SEARCH);
    setFoundItem(null);
    setNotFoundQuery("");
    setBillingPrice("");
    setReturnQty(1);
    setVariantSize("");
    setReason("");
    setReasonNote("");
    setErrors({});
  };

  const handleProductFound = useCallback(({ item }) => {
    setFoundItem(item);
    setBillingPrice(String(item.sellingPrice ?? item.unitPrice));
    setReturnQty(1);
    setVariantSize("");
    setNotFoundQuery("");
    setStep(STEP.DETAILS);
  }, []);

  // Picking a size snaps the billing price to that size's own price (its
  // catalog sellingPrice, or the selected batch's price for combined
  // batch+size items) — mirrors how the POS billing table behaves.
  const handleVariantSizeChange = useCallback(
    (size) => {
      setVariantSize(size);
      setErrors((e) => (e.variantSize ? { ...e, variantSize: undefined } : e));
      if (!foundItem) return;

      let price;
      if (Array.isArray(foundItem.selectedBatch?.sizes)) {
        const catalogVariant = (foundItem.variants || []).find(
          (v) => (v.size || "").trim().toLowerCase() === size.toLowerCase(),
        );
        if (catalogVariant && Number(catalogVariant.sellingPrice) > 0) {
          price = Number(catalogVariant.sellingPrice);
        } else if (Number(foundItem.selectedBatch.sellingPrice) > 0) {
          price = Number(foundItem.selectedBatch.sellingPrice);
        }
      } else {
        const variant = (foundItem.variants || []).find(
          (v) => (v.size || "").trim().toLowerCase() === size.toLowerCase(),
        );
        if (variant && Number(variant.sellingPrice) > 0) {
          price = Number(variant.sellingPrice);
        }
      }
      if (price !== undefined) setBillingPrice(String(price));
    },
    [foundItem],
  );

  const handleNotFound = useCallback((q) => {
    setNotFoundQuery(q);
    setFoundItem(null);
  }, []);

  const validate = () => {
    const errs = {};
    if (!billingPrice || Number(billingPrice) <= 0)
      errs.billingPrice = "Enter a valid billing price.";
    if (foundItem?.hasVariants && !variantSize)
      errs.variantSize = "Please select a size.";
    if (!reason) errs.reason = "Please select a reason.";
    if (reason === "other" && !reasonNote.trim())
      errs.reason = "Please describe the reason.";
    return errs;
  };

  const handleReturnSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setIsSubmitting(true);

    const payload = mapReturnData({
      returnItems: [
        {
          ...foundItem,
          returnQty,
          unitPrice: Number(billingPrice),
          variantSize: foundItem?.hasVariants ? variantSize : undefined,
        },
      ],
      reason,
      reasonNote,
    });

    try {
      await returnApi.createReturn(api, payload);
      showSuccess("Return processed successfully");
      resetAll(true);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to process return";
      setErrors({ submit: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExchangeSubmit = async ({
    newProduct,
    newVariantSize,
    newQty,
    newUnitPrice,
  }) => {
    const errs = validate();
    if (newProduct?.item?.hasVariants && !newVariantSize) {
      errs.newVariantSize = "Please select a size for the new item.";
    }
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setIsSubmitting(true);

    const payload = mapExchangeData({
      returnItems: [
        {
          ...foundItem,
          returnQty,
          unitPrice: Number(billingPrice),
          variantSize: foundItem?.hasVariants ? variantSize : undefined,
        },
      ],
      exchangeItems: [
        {
          ...newProduct.item,
          qty: newQty,
          unitPrice: Number(newUnitPrice),
          variantSize: newProduct.item?.hasVariants
            ? newVariantSize
            : undefined,
        },
      ],
      reason,
      reasonNote,
    });

    try {
      await returnApi.createExchange(api, payload);
      showSuccess("Exchange processed successfully");
      resetAll(true);
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to process exchange";
      setErrors({ submit: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <PageHeader
        icon="↩"
        title="Return & Exchange"
        description="Select transaction type, then scan or enter the product code."
      />

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-background-secondary shadow-soft">
        {/* Tab bar */}
        <div className="flex border-b border-gray-200">
          {[
            {
              value: "return",
              label: "↩ Return",
              desc: "Refund a purchased item",
            },
            {
              value: "exchange",
              label: "🔄 Exchange",
              desc: "Swap for a different item",
            },
          ].map((tab) => {
            const active = mode === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => handleTabChange(tab.value)}
                className={[
                  "flex-1 px-5 py-4 text-left transition-all cursor-pointer focus:outline-none",
                  "border-b-2",
                  active
                    ? "border-primary bg-primary-subtle"
                    : "border-transparent hover:bg-background-subtle",
                ].join(" ")}
              >
                <p
                  className={`text-sm font-bold ${active ? "text-primary" : "text-text-secondary"}`}
                >
                  {tab.label}
                </p>
                <p className="text-xs text-text-tertiary mt-0.5">{tab.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="p-5">
          {/* Step indicator + start over */}
          <div className="mb-5 flex items-center justify-between">
            <StepIndicator current={step} mode={mode} />
            {step > STEP.SEARCH && (
              <button
                type="button"
                onClick={() => resetAll(true)}
                className="text-xs font-semibold text-text-tertiary hover:text-error transition-colors cursor-pointer"
              >
                ✕ Start Over
              </button>
            )}
          </div>

          {/* ── STEP 1: Scan / search ── */}
          {step === STEP.SEARCH && (
            <div className="space-y-4">
              <ReturnSearchBar
                api={api}
                label="Scan Barcode / Enter Product Code"
                onFound={handleProductFound}
                onNotFound={handleNotFound}
                autoFocus
              />
              {notFoundQuery && (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-error/40 bg-error-subtle py-8 text-center">
                  <span className="text-3xl">🔎</span>
                  <div>
                    <p className="text-sm font-bold text-error">
                      Product Not Found
                    </p>
                    <p className="mt-1 text-xs text-text-secondary">
                      No product matched{" "}
                      <span className="font-semibold">"{notFoundQuery}"</span>.
                      Check the code and try again.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: Product details + form ── */}
          {step === STEP.DETAILS && (
            <div className="space-y-5">
              <ProductDetailsCard
                heading={
                  mode === "exchange"
                    ? "Item Being Returned"
                    : "Returned Product"
                }
                item={foundItem}
                billingPrice={billingPrice}
                onBillingPriceChange={(v) => {
                  setBillingPrice(v);
                  if (errors.billingPrice)
                    setErrors((e) => ({ ...e, billingPrice: undefined }));
                }}
                returnQty={returnQty}
                onReturnQtyChange={setReturnQty}
                variantSize={variantSize}
                onVariantSizeChange={handleVariantSizeChange}
                sizeError={errors.variantSize}
              />
              {errors.billingPrice && (
                <p className="text-xs font-medium text-error">
                  {errors.billingPrice}
                </p>
              )}

              {mode === "return" && (
                <ReturnForm
                  item={foundItem}
                  returnQty={returnQty}
                  billingPrice={billingPrice}
                  reason={reason}
                  onReasonChange={setReason}
                  reasonNote={reasonNote}
                  onReasonNoteChange={setReasonNote}
                  onSubmit={handleReturnSubmit}
                  isSubmitting={isSubmitting}
                  errors={errors}
                />
              )}
              {mode === "exchange" && (
                <ExchangePanel
                  api={api}
                  returnedItem={foundItem}
                  returnQty={returnQty}
                  billingPrice={billingPrice}
                  reason={reason}
                  onReasonChange={setReason}
                  reasonNote={reasonNote}
                  onReasonNoteChange={setReasonNote}
                  onSubmit={handleExchangeSubmit}
                  isSubmitting={isSubmitting}
                  errors={errors}
                />
              )}
              {errors.submit && (
                <p className="text-xs font-medium text-error text-center">
                  {errors.submit}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReturnPage;
