import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CloseButton from "./CloseButton";
import SupplierDetailsContent from "../supplier/supplierForm/SupplierDetailsContent";
import { useNavigate } from "react-router-dom";

const ACTIONS = [
  "Overview",
  "Receive Goods",
  "View GRNs",
  "Pay",
  "Edit",
  "View",
];

export default function SupplierSidebarActionPanel({
  open,
  onClose,
  supplier = null,
  onActionChange,
  style = {},
}) {
  const navigate = useNavigate();
  const [panelMode, setPanelMode] = useState("Overview");

  useEffect(() => {
    if (open) setPanelMode("Overview");
  }, [open]);

  useEffect(() => {
    if (onActionChange) onActionChange(panelMode);
    // eslint-disable-next-line
  }, [panelMode]);

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="supplier-actions"
          initial={{ opacity: 0, y: -6, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.99 }}
          transition={{ type: "spring", stiffness: 420, damping: 30 }}
          style={style}
          className="w-full overflow-hidden border rounded-2xl border-border-light bg-background-secondary shadow-float"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border-light bg-background-subtle">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold tracking-wider text-text-tertiary">
                SUPPLIER ACTIONS
              </p>
              <p className="text-sm font-semibold truncate text-text-primary">
                Choose an action
              </p>
            </div>

            <CloseButton
              onClick={onClose}
              size="sm"
              ariaLabel="Close supplier actions"
            />
          </div>

          {/* Actions (vertical list top -> bottom) */}
          <div className="p-2">
            <div className="space-y-2">
              {ACTIONS.map((action) => {
                const active = panelMode === action;

                return (
                  <motion.button
                    key={action}
                    type="button"
                    onClick={() => setPanelMode(action)}
                    whileTap={{ scale: 0.98 }}
                    className={[
                      "w-full cursor-pointer rounded-2xl px-4 py-3 text-left",
                      "transition shadow-soft",
                      "focus:outline-none focus-visible:ring-4 focus-visible:ring-ring-focus/25",
                      active
                        ? "bg-primary text-text-inverse shadow-card"
                        : "bg-background-secondary text-text-primary hover:bg-background-subtle hover:shadow-card",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{action}</span>
                      <span
                        className={[
                          "h-2 w-2 rounded-full transition",
                          active ? "bg-accent" : "bg-border-light",
                        ].join(" ")}
                        aria-hidden="true"
                      />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="p-4 border-t border-border-light bg-background-secondary">
            {(panelMode === "Overview" || panelMode === "View") && (
              <SupplierDetailsContent supplier={supplier} />
            )}

            {panelMode === "Receive Goods" && (
              <div className="text-sm text-text-tertiary">
                [Receive Goods form here]
              </div>
            )}

            {panelMode === "View GRNs" && (
              <div className="text-sm text-text-tertiary">[GRN list here]</div>
            )}

            {panelMode === "Pay" && (
              <div className="text-sm text-text-tertiary">[Pay form here]</div>
            )}

            {panelMode === "Edit" && (
              <div className="text-sm text-text-tertiary">[Edit form here]</div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
