import React, { useEffect, useRef, useState } from "react";
import { showSuccess, showError } from "../../../../../utils/toastHelper";
import InputModal from "../../../../common/InputModal";
import BarcodeForm from "../../../../../features/barcode/components/BarcodeForm";
import { BARCODE_TYPES } from "../../../../../features/barcode/constants/barcodeConstants";

const EssentialInformation = ({
  api,
  form,
  errs,
  hasSubmitted,
  categories,
  customCategories,
  baseUnits,
  customBaseUnits,
  onCategoryAdd,
  onCategoryDelete,
  onBaseUnitAdd,
  onBaseUnitDelete,
  updateField,
  setError,
}) => {
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showBaseUnitDropdown, setShowBaseUnitDropdown] = useState(false);

  const categoryRef = useRef(null);
  const baseUnitRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target))
        setShowCategoryDropdown(false);
      if (baseUnitRef.current && !baseUnitRef.current.contains(e.target))
        setShowBaseUnitDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Barcode feature state – re-sync when the parent form changes (e.g. edit mode)
  const [barcodeFormData, setBarcodeFormData] = useState({
    barcodeType: BARCODE_TYPES[0].value,
    barcode: form.barcode || "",
  });

  // Keep barcode in sync whenever the parent form.barcode changes (edit modal open)
  React.useEffect(() => {
    setBarcodeFormData((prev) => ({
      ...prev,
      barcode: form.barcode || "",
    }));
  }, [form.barcode]);

  // Keep barcode form in sync with parent form field
  const handleBarcodeFormChange = (next) => {
    setBarcodeFormData(next);
    updateField("barcode", next.barcode);
  };

  // Local state for custom categories and units
  const [localCustomCategories, setLocalCustomCategories] = useState(
    customCategories || [],
  );
  const [localCustomBaseUnits, setLocalCustomBaseUnits] = useState(
    customBaseUnits || [],
  );

  // Modal state
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    placeholder: "",
    onSubmit: null,
  });

  const categoryOptions = Array.from(
    new Set([...(categories || []), ...localCustomCategories]),
  );
  const baseUnitOptions = Array.from(
    new Set([...(baseUnits || []), ...localCustomBaseUnits]),
  );

  const CUSTOM_CATEGORIES_KEY = "pos_custom_item_categories";
  const CUSTOM_UNITS_KEY = "pos_custom_item_units";

  const handleAddCategoryClick = () => {
    if (onCategoryAdd) return onCategoryAdd();

    setModalConfig({
      isOpen: true,
      title: "Add New Category",
      placeholder: "Enter category name",
      onSubmit: (name) => {
        const trimmed = name.trim();

        const exists = categoryOptions.some(
          (c) => (c || "").toLowerCase() === trimmed.toLowerCase(),
        );
        if (exists) {
          setError("category", "Category already exists.");
          showError("Category already exists");
          setModalConfig((prev) => ({ ...prev, isOpen: false }));
          return;
        }

        try {
          const storedCats = JSON.parse(
            localStorage.getItem(CUSTOM_CATEGORIES_KEY) || "[]",
          );
          const next = [...storedCats, trimmed];
          localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(next));
          setLocalCustomCategories(next);
          updateField("category", trimmed);
          setError("category", "");
          showSuccess("Category added");
        } catch (err) {
          console.error("Failed to add category", err);
          showError("Failed to add category");
        }

        setModalConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleAddBaseUnitClick = () => {
    if (onBaseUnitAdd) return onBaseUnitAdd();

    setModalConfig({
      isOpen: true,
      title: "Add New Base Unit",
      placeholder: "Enter base unit (e.g., box, kg, liter)",
      onSubmit: (name) => {
        const trimmed = name.trim();

        const exists = baseUnitOptions.some(
          (u) => (u || "").toLowerCase() === trimmed.toLowerCase(),
        );
        if (exists) {
          setError("baseUnit", "Base unit already exists.");
          showError("Base unit already exists");
          setModalConfig((prev) => ({ ...prev, isOpen: false }));
          return;
        }

        try {
          const storedUnits = JSON.parse(
            localStorage.getItem(CUSTOM_UNITS_KEY) || "[]",
          );
          const next = [...storedUnits, trimmed];
          localStorage.setItem(CUSTOM_UNITS_KEY, JSON.stringify(next));
          setLocalCustomBaseUnits(next);
          updateField("baseUnit", trimmed);
          setError("baseUnit", "");
          showSuccess("Base unit added");
        } catch (err) {
          console.error("Failed to add base unit", err);
          showError("Failed to add base unit");
        }

        setModalConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleDeleteBaseUnit = (unit) => {
    const isCustom = localCustomBaseUnits.includes(unit);
    if (isCustom) {
      try {
        const storedUnits = JSON.parse(
          localStorage.getItem(CUSTOM_UNITS_KEY) || "[]",
        );
        const next = storedUnits.filter((u) => u !== unit);
        localStorage.setItem(CUSTOM_UNITS_KEY, JSON.stringify(next));
        setLocalCustomBaseUnits(next);
        if (form.baseUnit === unit) updateField("baseUnit", "");
        showSuccess("Base unit deleted");
      } catch (err) {
        console.error("Failed to delete base unit", err);
      }
      return;
    }

    onBaseUnitDelete?.(unit);
  };

  // Handle category deletion
  const handleDeleteCategory = (cat) => {
    const isCustom = localCustomCategories.includes(cat);
    if (isCustom) {
      try {
        const storedCats = JSON.parse(
          localStorage.getItem(CUSTOM_CATEGORIES_KEY) || "[]",
        );
        const next = storedCats.filter((c) => c !== cat);
        localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(next));
        setLocalCustomCategories(next);
        if (form.category === cat) updateField("category", "");
        showSuccess("Category deleted");
      } catch (err) {
        console.error("Failed to delete category", err);
      }
      return;
    }
    onCategoryDelete?.(cat);
  };

  return (
    <div>
      <h3 className="mb-4 text-base font-semibold text-gray-900 sm:text-lg">
        Essential Information
      </h3>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* SKU */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            SKU <span className="text-red-500">*</span>
          </label>
          <input
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm transition-all ${
              errs.sku ? "border-red-300 bg-red-50" : "border-gray-300"
            }`}
            value={form.sku}
            onChange={(e) => updateField("sku", e.target.value)}
            placeholder="e.g., MILK001"
          />
          {errs.sku && <p className="text-xs text-red-600">{errs.sku}</p>}
        </div>

        {/* Name */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Item Name <span className="text-red-500">*</span>
          </label>
          <input
            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm transition-all ${
              errs.name ? "border-red-300 bg-red-50" : "border-gray-300"
            }`}
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="Enter item name"
          />
          {errs.name && <p className="text-xs text-red-600">{errs.name}</p>}
        </div>

        {/* Barcode – managed by BarcodeForm */}
        <div className="md:col-span-2 lg:col-span-3">
          <BarcodeForm
            api={api}
            formData={barcodeFormData}
            setFormData={handleBarcodeFormChange}
            excludeId={form._id}
          />
          {errs.barcode && (
            <p className="mt-1 text-xs text-red-600">{errs.barcode}</p>
          )}
        </div>

        {/* Category */}
        <div ref={categoryRef} className="relative space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Category <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              className="text-sm cursor-pointer text-primary hover:underline"
              onClick={handleAddCategoryClick}
            >
              + Add New
            </button>
          </div>

          <button
            type="button"
            className={`w-full flex items-center justify-between px-4 py-3 border-2 rounded-xl text-left text-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer ${
              errs.category ? "border-red-300 bg-red-50" : "border-gray-300"
            } ${showCategoryDropdown ? "border-primary" : ""}`}
            onClick={() => setShowCategoryDropdown((p) => !p)}
          >
            <span className={form.category ? "text-gray-900" : "text-gray-400"}>
              {form.category || "Select category"}
            </span>
            <span className="text-sm text-gray-500">▾</span>
          </button>

          {errs.category && (
            <p className="text-xs text-red-600">{errs.category}</p>
          )}

          {showCategoryDropdown && (
            <div className="absolute z-10 w-full mt-1 overflow-y-auto text-sm bg-white border border-gray-300 shadow-lg max-h-48 rounded-xl">
              {categoryOptions.length === 0 ? (
                <div className="px-4 py-3 text-gray-500">
                  No categories. Click + Add New to create one.
                </div>
              ) : (
                categoryOptions.map((cat) => (
                  <div
                    key={cat}
                    className="flex items-center justify-between px-4 py-3 border-b border-gray-100 cursor-pointer group hover:bg-gray-50 last:border-b-0"
                    onClick={() => {
                      updateField("category", cat);
                      setShowCategoryDropdown(false);
                    }}
                  >
                    <span className="text-gray-900">{cat}</span>
                    <button
                      type="button"
                      className="text-red-500 transition-opacity opacity-0 cursor-pointer hover:text-red-700 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCategory(cat);
                      }}
                      title="Delete category"
                    >
                      🗑️
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Base Unit */}
        <div ref={baseUnitRef} className="relative space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Base Unit <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              className="text-sm cursor-pointer text-primary hover:underline"
              onClick={handleAddBaseUnitClick}
            >
              + Add New
            </button>
          </div>

          <button
            type="button"
            className={`w-full flex items-center justify-between px-4 py-3 border-2 rounded-xl text-left text-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer ${
              errs.baseUnit ? "border-red-300 bg-red-50" : "border-gray-300"
            } ${showBaseUnitDropdown ? "border-primary" : ""}`}
            onClick={() => setShowBaseUnitDropdown((p) => !p)}
          >
            <span className={form.baseUnit ? "text-gray-900" : "text-gray-400"}>
              {form.baseUnit || "Select unit"}
            </span>
            <span className="text-sm text-gray-500">▾</span>
          </button>

          {errs.baseUnit && (
            <p className="text-xs text-red-600">{errs.baseUnit}</p>
          )}

          {showBaseUnitDropdown && (
            <div className="absolute z-10 w-full mt-1 overflow-y-auto text-sm bg-white border border-gray-300 shadow-lg max-h-48 rounded-xl">
              {baseUnitOptions.length === 0 ? (
                <div className="px-4 py-3 text-gray-500">
                  No base units. Click + Add New to create one.
                </div>
              ) : (
                baseUnitOptions.map((u) => (
                  <div
                    key={u}
                    className="flex items-center justify-between px-4 py-3 border-b border-gray-100 cursor-pointer group hover:bg-gray-50 last:border-b-0"
                    onClick={() => {
                      updateField("baseUnit", u);
                      setShowBaseUnitDropdown(false);
                    }}
                  >
                    <span className="text-gray-900">{u}</span>
                    <button
                      type="button"
                      className="text-red-500 transition-opacity opacity-0 cursor-pointer hover:text-red-700 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteBaseUnit(u);
                      }}
                      title="Delete base unit"
                    >
                      🗑️
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="mt-4">
        <label className="block mb-2 text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          rows={3}
          className="w-full px-4 py-3 text-sm border-2 border-gray-300 resize-none rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
          value={form.description}
          onChange={(e) => updateField("description", e.target.value)}
          placeholder="Optional description..."
        />
      </div>

      {/* Input Modal */}
      <InputModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
        onSubmit={modalConfig.onSubmit}
        title={modalConfig.title}
        placeholder={modalConfig.placeholder}
      />
    </div>
  );
};

export default EssentialInformation;
