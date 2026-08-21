import React, { useEffect, useMemo, useState } from "react";
import AppLoader from "../../../common/AppLoader";
import {
  showSuccess,
  showError,
  errorMessages,
  successMessages,
} from "../../../../utils/toastHelper";
import { createItem, updateItem } from "../../../../api/inventory/items";
import FormHeader from "./FormHeader";
import FormFooter from "./FormFooter";
import ItemForm from "./ItemForm";
import { colors } from "../../../../themes/colors";

/**
 * AddNewItem (MASTER ONLY)
 * 🔒 No stock mutation fields (onHand, reserved, openingStock, batches) are allowed here.
 *
 * Props:
 * - open, onClose, onSuccess
 * - item: existing item for edit
 * - suppliers, categories, baseUnits
 * - onCategoryAdd, onBaseUnitAdd, onCategoryDelete
 * - mode (optional): "default" | "grn" (you can use to hide fields if you want)
 */
const AddNewItem = ({
  api,
  open,
  onClose,
  onSuccess,
  item: existingItem,

  suppliers = [],
  categories = [],
  baseUnits = [],

  onCategoryAdd,
  onBaseUnitAdd,
  onBaseUnitDelete,
  onCategoryDelete,

  mode = "default",
  defaultSupplierId,
}) => {
  const emptyForm = useMemo(
    () => ({
      sku: "",
      name: "",
      barcode: "",
      category: "",
      brand: "",
      description: "",

      baseUnit: "",

      sellingPrice: "",
      costPrice: "",

      taxApplicable: false,
      taxRate: "",
      taxCode: "",

      defaultSupplier: defaultSupplierId || "",

      isBatchTracked: false,
      isSerialTracked: false,

      // ✅ safe “stock policy” fields (not stock qty)
      lowStockLevel: "",
      reorderQuantity: "",

      // Sizes / variants: same name & barcode, different size/price/stock
      hasVariants: false,
      variants: [],

      isActive: true,
    }),
    [baseUnits, defaultSupplierId],
  );

  const emptyVariantRow = () => ({
    size: "",
    sku: "",
    sellingPrice: "",
    costPrice: "",
    stock: "",
  });

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errs, setErrs] = useState({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [customCategories, setCustomCategories] = useState([]);
  const [customBaseUnits, setCustomBaseUnits] = useState([]);
  const CUSTOM_CATEGORIES_KEY = "pos_custom_item_categories";
  const CUSTOM_UNITS_KEY = "pos_custom_item_units";

  // ---------- init ----------
  useEffect(() => {
    if (!open) return;

    if (existingItem) {
      setEditingId(existingItem._id);

      setForm({
        ...emptyForm,
        ...existingItem,

        sku: existingItem.sku || "",
        name: existingItem.name || "",
        barcode: existingItem.barcode || "",
        category: existingItem.category || "",
        brand: existingItem.brand || "",
        description: existingItem.description || "",

        baseUnit: existingItem.baseUnit || emptyForm.baseUnit,

        sellingPrice:
          existingItem.sellingPrice === 0 || existingItem.sellingPrice
            ? String(existingItem.sellingPrice)
            : "",
        costPrice:
          existingItem.costPrice === 0 || existingItem.costPrice
            ? String(existingItem.costPrice)
            : "",

        taxApplicable: Boolean(existingItem.taxApplicable),
        taxRate:
          existingItem.taxRate === 0 || existingItem.taxRate
            ? String(existingItem.taxRate)
            : "",
        taxCode: existingItem.taxCode || "",

        defaultSupplier:
          existingItem.defaultSupplier?._id ||
          existingItem.defaultSupplier ||
          defaultSupplierId ||
          "",

        isBatchTracked: Boolean(existingItem.isBatchTracked),
        isSerialTracked: Boolean(existingItem.isSerialTracked),

        hasVariants: Boolean(existingItem.hasVariants),
        variants: Array.isArray(existingItem.variants)
          ? existingItem.variants.map((v) => ({
              _id: v._id,
              size: v.size || "",
              sku: v.sku || "",
              sellingPrice:
                v.sellingPrice === 0 || v.sellingPrice
                  ? String(v.sellingPrice)
                  : "",
              costPrice:
                v.costPrice === 0 || v.costPrice ? String(v.costPrice) : "",
              stock: v.stock === 0 || v.stock ? String(v.stock) : "",
            }))
          : [],

        lowStockLevel:
          existingItem.lowStockLevel === 0 || existingItem.lowStockLevel
            ? String(existingItem.lowStockLevel)
            : "10",

        isActive: existingItem.isActive ?? true,
      });
    } else {
      setEditingId(null);
      setForm(emptyForm);
    }

    setErrs({});
    setHasSubmitted(false);
  }, [open, existingItem, emptyForm, defaultSupplierId]);

  useEffect(() => {
    try {
      const storedCats = JSON.parse(
        localStorage.getItem(CUSTOM_CATEGORIES_KEY) || "[]",
      );
      const storedUnits = JSON.parse(
        localStorage.getItem(CUSTOM_UNITS_KEY) || "[]",
      );
      if (Array.isArray(storedCats)) setCustomCategories(storedCats);
      if (Array.isArray(storedUnits)) setCustomBaseUnits(storedUnits);
    } catch (err) {
      console.error("Failed to load custom lists", err);
    }
  }, []);

  const setError = (k, v) => setErrs((p) => ({ ...p, [k]: v }));

  const validateNumber = (
    value,
    { required = false, min = 0, max = null } = {},
  ) => {
    const v = (value ?? "").toString().trim();
    if (!v) return required ? "Required" : "";
    const n = Number(v);
    if (Number.isNaN(n)) return "Must be a valid number";
    if (n < min) return `Must be ≥ ${min}`;
    if (max !== null && n > max) return `Must be ≤ ${max}`;
    return "";
  };

  const validate = (next = form, { silent = false } = {}) => {
    const e = {};

    // required
    const sku = String(next.sku || "").trim();
    if (!sku) e.sku = "SKU is required";
    else if (sku.length > 50) e.sku = "SKU must be 50 characters or less";
    else if (!/[a-zA-Z]/.test(sku))
      e.sku = "SKU must contain at least one letter";

    const name = String(next.name || "").trim();
    if (!name) e.name = "Item name is required";
    else if (name.length < 2)
      e.name = "Item name must be at least 2 characters";
    else if (name.length > 120)
      e.name = "Item name must be 120 characters or less";
    else if (!/[a-zA-Z]/.test(name))
      e.name = "Item name must contain at least one letter";
    const baseUnitValue = String(next.baseUnit || "").trim();
    if (!baseUnitValue) e.baseUnit = "Base unit is required";
    if (!String(next.category || "").trim())
      e.category = "Category is required";

    const barcode = String(next.barcode || "").trim();
    if (barcode.length > 0 && barcode.length > 64)
      e.barcode = "Barcode must be 64 characters or less";

    // pricing
    {
      const msg = validateNumber(next.costPrice, { required: true, min: 0 });
      if (msg) e.costPrice = `Cost price ${msg.toLowerCase()}`;
    }
    {
      const msg = validateNumber(next.sellingPrice, { required: true, min: 0 });
      if (msg) e.sellingPrice = `Selling price ${msg.toLowerCase()}`;
    }

    // tax
    if (next.taxApplicable) {
      const msg = validateNumber(next.taxRate, {
        required: true,
        min: 0,
        max: 100,
      });
      if (msg) e.taxRate = `Tax rate ${msg.toLowerCase()}`;
    }

    // tracking mode safety
    if (next.isBatchTracked && next.isSerialTracked) {
      e.tracking = "Item cannot be both batch-tracked and serial-tracked.";
    }
    // Items with sizes don't need a tracking mode selected — by default,
    // stock is entered directly per size on this form. Tracking mode only
    // needs to be chosen for non-sized items, or if the user explicitly
    // wants sized stock to come from batches/GRN instead (combined mode).
    if (!next.isBatchTracked && !next.isSerialTracked && !next.hasVariants) {
      e.tracking = "Select a tracking mode: batch or serial.";
    }

    // sizes / variants
    if (next.hasVariants) {
      const rows = Array.isArray(next.variants) ? next.variants : [];
      if (rows.length === 0) {
        e.variants = "Add at least one size.";
      } else {
        const seenSizes = new Set();
        rows.forEach((v, idx) => {
          const size = String(v.size || "").trim();
          if (!size) {
            e[`variant_${idx}_size`] = "Size name is required";
          } else {
            const key = size.toLowerCase();
            if (seenSizes.has(key)) {
              e[`variant_${idx}_size`] = "Duplicate size name";
            }
            seenSizes.add(key);
          }

          const priceMsg = validateNumber(v.sellingPrice, {
            required: true,
            min: 0,
          });
          if (priceMsg) e[`variant_${idx}_sellingPrice`] = priceMsg;

          const costMsg = validateNumber(v.costPrice, {
            required: false,
            min: 0,
          });
          if (costMsg) e[`variant_${idx}_costPrice`] = costMsg;

          const stockMsg = validateNumber(v.stock, {
            required: false,
            min: 0,
          });
          if (stockMsg) e[`variant_${idx}_stock`] = stockMsg;
        });
      }
    }

    // unit conversions
    const baseUnit = String(next.baseUnit || "").trim();

    // thresholds (optional but must be valid if provided)
    {
      const msg = validateNumber(next.lowStockLevel, {
        required: true,
        min: 0,
      });
      if (msg) e.lowStockLevel = `Low stock level ${msg.toLowerCase()}`;
    }
    {
      const msg = validateNumber(next.reorderQuantity, {
        required: false,
        min: 0,
      });
      if (msg) e.reorderQuantity = `Reorder quantity ${msg.toLowerCase()}`;
    }

    if (!silent) setErrs(e);
    return Object.keys(e).length === 0;
  };

  const updateField = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };

      // normalize sku
      if (field === "sku")
        next.sku = String(value || "")
          .trim()
          .toUpperCase();

      // baseUnit change -> force units[].toUnit = baseUnit
      if (field === "baseUnit") {
        next.baseUnit = value;
      }

      // tax off -> clear rate
      if (field === "taxApplicable" && !value) {
        next.taxRate = "";
      }

      // tracking toggle safety: if enabling one, auto-disable the other
      if (field === "isBatchTracked" && value === true) {
        next.isSerialTracked = false;
      }
      if (field === "isSerialTracked" && value === true) {
        next.isBatchTracked = false;
      }

      // turning "has sizes" on: seed one empty row if none exist yet
      if (field === "hasVariants") {
        if (value === true && (!next.variants || next.variants.length === 0)) {
          next.variants = [emptyVariantRow()];
        }
      }

      // validate only after the first submit
      validate(next, { silent: !hasSubmitted });
      return next;
    });
  };

  const addVariantRow = () => {
    setForm((prev) => {
      const next = {
        ...prev,
        variants: [...(prev.variants || []), emptyVariantRow()],
      };
      validate(next, { silent: !hasSubmitted });
      return next;
    });
  };

  const removeVariantRow = (index) => {
    setForm((prev) => {
      const next = {
        ...prev,
        variants: (prev.variants || []).filter((_, i) => i !== index),
      };
      validate(next, { silent: !hasSubmitted });
      return next;
    });
  };

  const updateVariantField = (index, field, value) => {
    setForm((prev) => {
      const rows = [...(prev.variants || [])];
      rows[index] = { ...rows[index], [field]: value };
      const next = { ...prev, variants: rows };
      validate(next, { silent: !hasSubmitted });
      return next;
    });
  };

  const handleAddCategoryClick = async () => {
    if (onCategoryAdd) return onCategoryAdd();

    const name = window.prompt("Enter new category name");
    const trimmed = (name || "").trim();
    if (!trimmed) return;

    const categoryOptions = Array.from(
      new Set([...(categories || []), ...customCategories]),
    );
    const exists = categoryOptions.some(
      (c) => (c || "").toLowerCase() === trimmed.toLowerCase(),
    );
    if (exists) {
      setError("category", "Category already exists.");
      return;
    }

    setCustomCategories((prev) => {
      const next = [...prev, trimmed];
      localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(next));
      return next;
    });
    updateField("category", trimmed);
    setError("category", "");
    showSuccess("Category added");
  };

  const handleAddBaseUnitClick = async () => {
    if (onBaseUnitAdd) return onBaseUnitAdd();

    const name = window.prompt("Enter new base unit (e.g., box)");
    const trimmed = (name || "").trim();
    if (!trimmed) return;

    const baseUnitOptions = Array.from(
      new Set([...(baseUnits || []), ...customBaseUnits]),
    );
    const exists = baseUnitOptions.some(
      (u) => (u || "").toLowerCase() === trimmed.toLowerCase(),
    );
    if (exists) {
      setError("baseUnit", "Base unit already exists.");
      return;
    }

    setCustomBaseUnits((prev) => {
      const next = [...prev, trimmed];
      localStorage.setItem(CUSTOM_UNITS_KEY, JSON.stringify(next));
      return next;
    });
    updateField("baseUnit", trimmed);
    setError("baseUnit", "");
    showSuccess("Base unit added");
  };

  const handleDeleteBaseUnit = (unit) => {
    const isCustom = customBaseUnits.includes(unit);
    if (isCustom) {
      setCustomBaseUnits((prev) => {
        const next = prev.filter((u) => u !== unit);
        localStorage.setItem(CUSTOM_UNITS_KEY, JSON.stringify(next));
        return next;
      });
      if (form.baseUnit === unit) updateField("baseUnit", "");
      return;
    }

    onBaseUnitDelete?.(unit);
  };

  const handleSave = async () => {
    setHasSubmitted(true);
    if (!validate(form)) return;

    setSaving(true);
    try {
      // MASTER ONLY payload (no openingStock, no inventory.onHand/reserved, no batches)
      const payload = {
        sku: String(form.sku || "")
          .trim()
          .toUpperCase(),
        name: String(form.name || "").trim(),
        barcode: String(form.barcode || "").trim() || undefined,
        category: String(form.category || "").trim(),
        brand: String(form.brand || "").trim() || undefined,
        description: String(form.description || "").trim() || undefined,

        baseUnit: String(form.baseUnit || "").trim(),

        sellingPrice: Number(form.sellingPrice),
        costPrice: Number(form.costPrice),

        taxApplicable: Boolean(form.taxApplicable),
        taxRate: form.taxApplicable ? Number(form.taxRate || 0) : 0,
        taxCode: String(form.taxCode || "").trim() || undefined,

        // lowStockLevel is a top-level field in the Item model
        lowStockLevel:
          form.lowStockLevel === "" || form.lowStockLevel === null
            ? 10
            : Number(form.lowStockLevel),

        defaultSupplier: form.defaultSupplier || undefined,

        isBatchTracked: Boolean(form.isBatchTracked),
        isSerialTracked: Boolean(form.isSerialTracked),
        isActive: Boolean(form.isActive),

        // Sizes / variants (same name & barcode, different size/price/stock)
        hasVariants: Boolean(form.hasVariants),
        variants: form.hasVariants
          ? (form.variants || [])
              .filter((v) => String(v.size || "").trim())
              .map((v) => ({
                size: String(v.size || "").trim(),
                sku: String(v.sku || "").trim() || undefined,
                sellingPrice: Number(v.sellingPrice),
                costPrice:
                  v.costPrice === "" || v.costPrice === null
                    ? undefined
                    : Number(v.costPrice),
                stock: v.stock === "" || v.stock === null ? 0 : Number(v.stock),
              }))
          : undefined,
      };

      if (editingId) {
        await updateItem(api, editingId, payload);
        showSuccess(successMessages.update("Item"));
      } else {
        await createItem(api, payload);
        showSuccess(successMessages.create("Item"));
      }

      if (onSuccess) await onSuccess();
      onClose?.();
    } catch (err) {
      showError(
        err?.response?.data?.message ||
          err?.message ||
          errorMessages.save("item"),
      );
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 overflow-y-auto bg-white/75 backdrop-blur-sm sm:p-4">
      {/* Saving Loader */}
      <AppLoader
        open={saving}
        variant="overlay"
        title="Saving Item"
        subtitle={editingId ? "Updating your item" : "Creating new item"}
      />

      <div
        className="w-full max-w-4xl my-auto border border-gray-200 shadow-2xl rounded-2xl"
        style={{
          background: colors.background.secondary,
          border: `1px solid ${colors.border.light}`,
        }}
      >
        {/* Header */}
        <FormHeader editingId={editingId} onClose={onClose} />

        {/* Body */}
        <div className="max-h-[55vh] overflow-y-auto">
          <ItemForm
            api={api}
            form={form}
            errs={errs}
            hasSubmitted={hasSubmitted}
            categories={categories}
            customCategories={customCategories}
            baseUnits={baseUnits}
            customBaseUnits={customBaseUnits}
            suppliers={suppliers}
            onCategoryAdd={onCategoryAdd}
            onCategoryDelete={onCategoryDelete}
            onBaseUnitAdd={onBaseUnitAdd}
            onBaseUnitDelete={onBaseUnitDelete}
            updateField={updateField}
            setError={setError}
            addVariantRow={addVariantRow}
            removeVariantRow={removeVariantRow}
            updateVariantField={updateVariantField}
          />
        </div>

        {/* Footer */}
        <FormFooter
          saving={saving}
          editingId={editingId}
          onCancel={onClose}
          onSave={handleSave}
        />
      </div>
    </div>
  );
};

export default AddNewItem;
