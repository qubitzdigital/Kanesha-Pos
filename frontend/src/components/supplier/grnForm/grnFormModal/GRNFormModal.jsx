import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GRNForm from "../GRNForm";
import GRNFormHeader from "../GRNFormHeader";
import GRNFormActions from "../GRNFormActions";
import CloseButton from "../../../common/CloseButton";
import { colors } from "../../../../themes/colors";
const GRNFormModal = ({
  open,
  supplier,
  items,
  existingGRN,
  onSuccess,
  onClose,
  onItemsRefresh,
  suppliers,
  categories,
  baseUnits,
  api,
  currencySymbol = "Rs.",
  currencyPosition = "before",
  initialItemId = null,
}) => {
  if (!open || !supplier) return null;

  const [saving, setSaving] = useState(false);

  return (
    <AnimatePresence>
      {open && supplier && (
        <motion.div
          key="grn-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center px-3 py-4 bg-white/75 backdrop-blur-sm sm:px-4 sm:py-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-modal="true"
          role="dialog"
        >
          {/* Click-catcher (keeps logic: close via X only; this just blocks clicks behind) */}
          <div className="absolute inset-0" />

          <motion.div
            key="grn-modal-panel"
            className="relative w-full max-w-4xl overflow-hidden rounded-3xl shadow-float"
            style={{
              background: colors.background.secondary,
              border: `1px solid ${colors.border.light}`,
            }}
            initial={{ opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.99 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
          >
            {/* Top accent bar */}
            <div className="h-1.5 w-full bg-accent" />

            {/* Soft ambient glows */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute w-64 h-64 rounded-full -top-24 -right-24 bg-accent-subtle blur-3xl opacity-70" />
              <div className="absolute rounded-full -bottom-28 -left-28 h-72 w-72 bg-primary-subtle blur-3xl opacity-60" />
            </div>

            {/* Header (fixed) */}
            <div className="sticky top-0 z-20 border-b border-gray-200 bg-background-secondary/90 backdrop-blur-md">
              <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5">
                <div className="flex-1">
                  <GRNFormHeader
                    existingGRN={existingGRN}
                    supplier={supplier}
                  />
                </div>

                <div className="flex-none">
                  <CloseButton
                    onClick={onClose}
                    size="md"
                    isAnimated={true}
                    ariaLabel="Close modal"
                  />
                </div>
              </div>
            </div>

            {/* Scrollable body (only this scrolls) */}
            <div className="relative overflow-y-auto max-h-[calc(85vh-16rem)] px-4 py-4 sm:px-6 sm:py-6">
              {/* Inner container for consistent spacing */}
              <div className="rounded-2xl bg-background-secondary shadow-soft">
                <div className="p-2 -mt-3 sm:p-3 md:p-4">
                  <GRNForm
                    api={api}
                    supplier={supplier}
                    items={items}
                    existingGRN={existingGRN}
                    currencySymbol={currencySymbol}
                    currencyPosition={currencyPosition}
                    onSuccess={onSuccess}
                    onClose={onClose}
                    onItemsRefresh={onItemsRefresh}
                    suppliers={suppliers}
                    categories={categories}
                    baseUnits={baseUnits}
                    hideHeader={true}
                    hideActions={true}
                    formId="grn-form-modal"
                    onSavingChange={(v) => setSaving(v)}
                    initialItemId={initialItemId}
                  />
                </div>
              </div>
            </div>

            {/* Actions & footer hint (fixed bottom) */}
            <div className="sticky bottom-0 z-20 border-t border-gray-200 bg-background-secondary/95 backdrop-blur-md">
              <div className="px-4 py-3 sm:px-6 sm:py-4">
                <GRNFormActions
                  saving={saving}
                  isEditable={!existingGRN || existingGRN.status === "draft"}
                  existingGRN={existingGRN}
                  onCancel={onClose}
                  onSubmit={() =>
                    document.getElementById("grn-form-modal")?.requestSubmit()
                  }
                />

                <div className="-mt-4 text-[11px] text-text-tertiary">
                  Tip: Review quantities carefully before submitting.
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GRNFormModal;
