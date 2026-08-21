// GRNForm.jsx
import React, { useEffect, useMemo, useState } from "react";
import { createGRN, updateGRN, postGRN } from "../../../api/supplier/grn";
import AddNewItem from "../../inventory/product/addProduct/AddNewItem";
import GRNFormHeader from "./GRNFormHeader";
import GRNFormMetadata from "./GRNFormMetadata";
import GRNLineItemsTable from "./GRNLineItemsTable";
import GRNTotalsSection from "./GRNTotalsSection";
import GRNRemarksSection from "./GRNRemarksSection";
import GRNFormActions from "./GRNFormActions";
import {
  showSuccess,
  showError,
  errorMessages,
  successMessages,
} from "../../../utils/toastHelper";

/**
 * New workflow assumptions:
 * - Stock changes happen ONLY via GRN, Sales, StockAdjustments endpoints.
 * - Item endpoints are master-only, so AddNewItem must not send inventory/batches/openingStock.
 * - For batch-tracked items, GRN creates/updates batches; item endpoints never mutate batches.
 */
function GRNForm({
  api,
  supplier,
  items = [],
  existingGRN = null,
  onSuccess,
  onClose,
  hideHeader = false,
  hideActions = false,
  formId = "grn-form",
  onSavingChange = null,
  currencySymbol = "Rs.",
  currencyPosition = "before",

  // Optional: pre-select an item in the first line (e.g. opened from Inventory page)
  initialItemId = null,

  // parent refresh hook: fetch items list again after adding a new item
  onItemsRefresh, // async () => { ...fetch items... }

  // lookups for product modal
  suppliers = [],
  categories = [],
  baseUnits = [],
}) {
  const emptyLine = useMemo(
    () => ({
      item: "",
      batchNumber: "",
      variantSize: "",
      qty: "",
      unitCost: "",
      // When an item is both batch-tracked AND has sizes, the user can
      // switch this line into "size mode": one batch number, but multiple
      // sizes each with their own qty + price (e.g. one shipment/lot of
      // S/M/L). sizeLines holds those rows; variantSize/qty/unitCost above
      // are unused while sizeMode is on.
      sizeMode: false,
      sizeLines: [{ size: "", qty: "", unitCost: "" }],
    }),
    [],
  );

  const [form, setForm] = useState(() => ({
    grnDate: new Date().toISOString().substring(0, 10),
    remarks: "",
    lines: [initialItemId ? { ...emptyLine, item: initialItemId } : emptyLine],
  }));

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const isEditable = !existingGRN || existingGRN.status === "draft";
  const fieldsDisabled = saving || !isEditable;

  // Add Product modal state
  const [showAddItem, setShowAddItem] = useState(false);

  // Build item map
  const itemById = useMemo(() => {
    const m = new Map();
    for (const it of items) m.set(String(it._id), it);
    return m;
  }, [items]);

  useEffect(() => {
    if (!existingGRN) return;

    setForm({
      grnDate: existingGRN.grnDate
        ? new Date(existingGRN.grnDate).toISOString().substring(0, 10)
        : new Date().toISOString().substring(0, 10),
      remarks: existingGRN.remarks || "",
      lines: (existingGRN.lines || []).length
        ? existingGRN.lines.map((l) => ({
            item: l.item?._id || l.item || "",
            batchNumber: l.batchNumber || "",
            variantSize: l.variantSize || "",
            qty: l.qty ?? "",
            unitCost: l.unitCost === 0 || l.unitCost ? String(l.unitCost) : "",
            sizeMode: false,
            sizeLines: [{ size: "", qty: "", unitCost: "" }],
          }))
        : [emptyLine],
    });
  }, [existingGRN, emptyLine]);

  const clearError = (key) => {
    if (!errors[key]) return;
    setErrors((prev) => {
      const n = { ...prev };
      delete n[key];
      return n;
    });
  };

  const handleHeaderChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    clearError(name);
  };

  const handleLineChange = (index, e) => {
    const { name, value } = e.target;

    setForm((prev) => {
      const lines = [...prev.lines];
      const nextLine = { ...lines[index], [name]: value };

      // If item changes, clear batch/size fields (safest)
      if (name === "item") {
        nextLine.batchNumber = "";
        nextLine.variantSize = "";
        nextLine.sizeMode = false;
        nextLine.sizeLines = [{ size: "", qty: "", unitCost: "" }];
      }

      lines[index] = nextLine;
      return { ...prev, lines };
    });

    clearError(`line_${index}_${name}`);
  };

  // Turn "size mode" on/off for a batch-tracked + has-variants line.
  const toggleSizeMode = (index) => {
    setForm((prev) => {
      const lines = [...prev.lines];
      const nextLine = { ...lines[index] };
      nextLine.sizeMode = !nextLine.sizeMode;

      if (nextLine.sizeMode) {
        // Entering size mode: clear the single-size fields, start with one row.
        nextLine.variantSize = "";
        nextLine.qty = "";
        nextLine.unitCost = "";
        if (!nextLine.sizeLines || !nextLine.sizeLines.length) {
          nextLine.sizeLines = [{ size: "", qty: "", unitCost: "" }];
        }
      } else {
        // Leaving size mode: reset the size rows back to a single blank row.
        nextLine.sizeLines = [{ size: "", qty: "", unitCost: "" }];
      }

      lines[index] = nextLine;
      return { ...prev, lines };
    });

    // Clear any errors tied to this line's single-size or size-row fields
    setErrors((prev) => {
      const n = { ...prev };
      Object.keys(n).forEach((key) => {
        if (
          key.startsWith(`line_${index}_variantSize`) ||
          key.startsWith(`line_${index}_qty`) ||
          key.startsWith(`line_${index}_unitCost`) ||
          key.startsWith(`line_${index}_size_`)
        ) {
          delete n[key];
        }
      });
      return n;
    });
  };

  const addSizeLine = (index) => {
    setForm((prev) => {
      const lines = [...prev.lines];
      const nextLine = { ...lines[index] };
      nextLine.sizeLines = [
        ...(nextLine.sizeLines || []),
        { size: "", qty: "", unitCost: "" },
      ];
      lines[index] = nextLine;
      return { ...prev, lines };
    });
  };

  const removeSizeLine = (index, sizeIdx) => {
    setForm((prev) => {
      const lines = [...prev.lines];
      const nextLine = { ...lines[index] };
      const remaining = (nextLine.sizeLines || []).filter(
        (_, i) => i !== sizeIdx,
      );
      nextLine.sizeLines = remaining.length
        ? remaining
        : [{ size: "", qty: "", unitCost: "" }];
      lines[index] = nextLine;
      return { ...prev, lines };
    });

    clearError(`line_${index}_size_${sizeIdx}_size`);
    clearError(`line_${index}_size_${sizeIdx}_qty`);
    clearError(`line_${index}_size_${sizeIdx}_unitCost`);
  };

  const handleSizeLineChange = (index, sizeIdx, e) => {
    const { name, value } = e.target;

    setForm((prev) => {
      const lines = [...prev.lines];
      const nextLine = { ...lines[index] };
      const sizeLines = [...(nextLine.sizeLines || [])];
      sizeLines[sizeIdx] = { ...sizeLines[sizeIdx], [name]: value };
      nextLine.sizeLines = sizeLines;
      lines[index] = nextLine;
      return { ...prev, lines };
    });

    clearError(`line_${index}_size_${sizeIdx}_${name}`);
  };

  const addLine = () => {
    setForm((prev) => ({
      ...prev,
      lines: [...prev.lines, { ...emptyLine }],
    }));
  };

  const removeLine = (index) => {
    setForm((prev) => {
      const next = prev.lines.filter((_, i) => i !== index);
      return { ...prev, lines: next.length ? next : [{ ...emptyLine }] };
    });
  };

  const lineTotal = (line) => {
    if (line.sizeMode) {
      return (line.sizeLines || []).reduce((sum, s) => {
        const qty = Number(s.qty) || 0;
        const cost = Number(s.unitCost) || 0;
        return sum + qty * cost;
      }, 0);
    }
    const qty = Number(line.qty) || 0;
    const cost = Number(line.unitCost) || 0;
    return qty * cost;
  };

  const totals = useMemo(() => {
    return form.lines.reduce(
      (acc, line) => {
        if (line.sizeMode) {
          for (const s of line.sizeLines || []) {
            const qty = Number(s.qty) || 0;
            acc.totalQty += qty;
            acc.grandTotal += qty * (Number(s.unitCost) || 0);
          }
          return acc;
        }
        const qty = Number(line.qty) || 0;
        const base = qty * (Number(line.unitCost) || 0);
        acc.totalQty += qty;
        acc.grandTotal += base;
        return acc;
      },
      { totalQty: 0, grandTotal: 0 },
    );
  }, [form.lines]);

  const validateForm = () => {
    const newErrors = {};

    // No need to validate grnNo - it's auto-generated
    if (!supplier?._id) newErrors.supplier = "Supplier is required";
    if (!form.lines?.length) newErrors.lines = "At least one item is required";

    form.lines.forEach((line, idx) => {
      const it = line.item ? itemById.get(String(line.item)) : null;

      // do not allow selecting inactive items
      if (it && it.isActive === false) {
        newErrors[`line_${idx}_item`] = "This item is inactive";
      }

      const isBatchTracked = Boolean(it?.isBatchTracked);
      const hasVariants = Boolean(it?.hasVariants);

      if (!line.item) newErrors[`line_${idx}_item`] = "Item is required";

      // batch required only for batch-tracked
      if (isBatchTracked) {
        if (!line.batchNumber?.trim()) {
          newErrors[`line_${idx}_batchNumber`] = "Batch number is required";
        }
      }

      const useSizeMode = isBatchTracked && hasVariants && line.sizeMode;

      if (useSizeMode) {
        // Multiple sizes for one batch: validate each size row instead of
        // the single variantSize/qty/unitCost fields.
        const rows = line.sizeLines || [];
        const seenSizes = new Set();

        if (!rows.length) {
          newErrors[`line_${idx}_sizeLines`] = "Add at least one size";
        }

        rows.forEach((row, sizeIdx) => {
          if (!row.size?.trim()) {
            newErrors[`line_${idx}_size_${sizeIdx}_size`] = "Size is required";
          } else {
            const key = row.size.trim().toLowerCase();
            if (seenSizes.has(key)) {
              newErrors[`line_${idx}_size_${sizeIdx}_size`] =
                "This size is already added on this batch";
            }
            seenSizes.add(key);
          }

          if (!row.qty || Number(row.qty) <= 0) {
            newErrors[`line_${idx}_size_${sizeIdx}_qty`] = "Qty must be > 0";
          }

          if (
            row.unitCost === "" ||
            row.unitCost === null ||
            row.unitCost === undefined
          ) {
            newErrors[`line_${idx}_size_${sizeIdx}_unitCost`] =
              "Unit Cost is required";
          } else if (
            Number.isNaN(Number(row.unitCost)) ||
            Number(row.unitCost) < 0
          ) {
            newErrors[`line_${idx}_size_${sizeIdx}_unitCost`] =
              "Unit Cost must be >= 0";
          }
        });
      } else {
        if (!line.qty || Number(line.qty) <= 0) {
          newErrors[`line_${idx}_qty`] = "Qty must be > 0";
        }

        if (
          line.unitCost === "" ||
          line.unitCost === null ||
          line.unitCost === undefined
        ) {
          newErrors[`line_${idx}_unitCost`] = "Unit Cost is required";
        } else if (
          Number.isNaN(Number(line.unitCost)) ||
          Number(line.unitCost) < 0
        ) {
          newErrors[`line_${idx}_unitCost`] = "Unit Cost must be >= 0";
        }

        // size required only for items with sizes/variants
        if (hasVariants) {
          if (!line.variantSize?.trim()) {
            newErrors[`line_${idx}_variantSize`] = "Size is required";
          }
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const openAddProductForLine = () => {
    setShowAddItem(true);
  };

  const onItemCreatedFromModal = async () => {
    if (onItemsRefresh) await onItemsRefresh();
    // Optional: if AddNewItem returns created item, you can auto-select it here.
  };

  const buildPayload = () => ({
    grnDate: form.grnDate ? new Date(form.grnDate).toISOString() : undefined,
    remarks: form.remarks?.trim() || undefined,
    supplier: supplier._id,
    lines: form.lines.flatMap((l) => {
      const it = l.item ? itemById.get(String(l.item)) : null;
      const useSizeMode =
        Boolean(it?.isBatchTracked) && Boolean(it?.hasVariants) && l.sizeMode;

      if (useSizeMode) {
        // One UI line -> one payload line per size, all sharing the
        // same item + batch number.
        return (l.sizeLines || []).map((row) => ({
          item: l.item,
          batchNumber: l.batchNumber?.trim() || undefined,
          variantSize: row.size?.trim() || undefined,
          qty: Number(row.qty),
          unitCost: Number(row.unitCost),
        }));
      }

      return [
        {
          item: l.item,
          batchNumber: l.batchNumber?.trim() || undefined,
          variantSize: l.variantSize?.trim() || undefined,
          qty: Number(l.qty),
          unitCost: Number(l.unitCost),
        },
      ];
    }),
  });

  // shouldPost = true -> after saving the draft, immediately post it so
  // stock is updated right away (the "publish" action). shouldPost = false
  // -> leave it as a draft; stock is NOT touched until it's posted later
  // from the GRN details view.
  const submitGRN = async (shouldPost) => {
    if (!isEditable && existingGRN) {
      showError("Posted GRNs cannot be edited");
      return;
    }

    if (!validateForm()) {
      showError(errorMessages.validation);
      return;
    }

    try {
      setSaving(true);
      onSavingChange && onSavingChange(true);

      // Clean payload: GRN drives stock movement; server recomputes totals & batches.
      const payload = buildPayload();

      let saved;
      if (existingGRN) {
        saved = await updateGRN(api, existingGRN._id, payload);
      } else {
        saved = await createGRN(api, payload);
      }

      if (shouldPost) {
        // Posting is what actually updates stock — saving alone only
        // creates/updates the draft.
        saved = await postGRN(api, saved._id);
        showSuccess("GRN saved — stock updated");
      } else {
        showSuccess(
          existingGRN
            ? successMessages.update("GRN")
            : successMessages.create("GRN"),
        );
      }

      onSuccess && onSuccess(saved);
      onClose && onClose();
    } catch (err) {
      showError(
        err?.response?.data?.message ||
          (shouldPost
            ? errorMessages.postFailed("GRN")
            : errorMessages.save("GRN")),
      );
    } finally {
      setSaving(false);
      onSavingChange && onSavingChange(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Save always immediately posts too, so stock updates right away —
    // there's no separate "draft" step in the normal flow.
    await submitGRN(true);
  };

  return (
    <>
      <form id={formId} onSubmit={handleSubmit} className="space-y-6">
        {!hideHeader && (
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <GRNFormHeader existingGRN={existingGRN} supplier={supplier} />
            </div>
          </div>
        )}

        <GRNFormMetadata
          existingGRN={existingGRN}
          form={form}
          fieldsDisabled={fieldsDisabled}
          onHeaderChange={handleHeaderChange}
        />

        <GRNLineItemsTable
          form={form}
          items={items}
          errors={errors}
          fieldsDisabled={fieldsDisabled}
          isEditable={isEditable}
          itemById={itemById}
          lineTotal={lineTotal}
          currencySymbol={currencySymbol}
          currencyPosition={currencyPosition}
          onLineChange={handleLineChange}
          onAddProduct={openAddProductForLine}
          onRemoveLine={removeLine}
          onAddLine={addLine}
          onToggleSizeMode={toggleSizeMode}
          onAddSizeLine={addSizeLine}
          onRemoveSizeLine={removeSizeLine}
          onSizeLineChange={handleSizeLineChange}
        />

        <GRNTotalsSection
          totals={totals}
          currencySymbol={currencySymbol}
          currencyPosition={currencyPosition}
        />

        <GRNRemarksSection form={form} onHeaderChange={handleHeaderChange} />

        {!hideActions && (
          <GRNFormActions
            saving={saving}
            isEditable={isEditable}
            existingGRN={existingGRN}
            onCancel={onClose}
            onSubmit={handleSubmit}
          />
        )}
      </form>

      {/* Add Product Modal (master-only; no stock fields) */}
      <AddNewItem
        api={api}
        open={showAddItem}
        onClose={() => setShowAddItem(false)}
        onSuccess={async () => {
          await onItemCreatedFromModal();
          setShowAddItem(false);
        }}
        item={null}
        suppliers={suppliers}
        categories={categories}
        baseUnits={baseUnits}
        mode="master-only"
        defaultSupplierId={supplier?._id}
      />
    </>
  );
}

export default GRNForm;
