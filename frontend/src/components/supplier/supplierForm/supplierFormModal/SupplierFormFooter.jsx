// src/components/supplier/SupplierFormFooter.jsx
import React from "react";
import colors from "../../../../themes/colors";
const SupplierFormFooter = ({ saving, isEdit, onCancel, onSubmit }) => {
  return (
    <div className="sticky mb-4 bottom-0 z-10 border-t border-gray-200 bg-background-secondary/95 backdrop-blur supports-[backdrop-filter]:bg-background-secondary/80">
      <div className="flex flex-col-reverse gap-3 px-6 mt-4 sm:flex-row sm:items-center sm:justify-end ">
        <button
          type="button"
          onClick={onCancel}
          className="
            inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-border-default
            bg-background-secondary px-5 py-2.5 text-sm font-semibold text-text-primary
            shadow-sm transition duration-200 ease-out
            hover:-translate-y-0.5 hover:bg-background-subtle hover:shadow-md
            active:translate-y-0
            focus:outline-none focus:ring-4 focus:ring-focus/20
            cursor-pointer
            sm:w-auto
          "
        >
          ✕ Cancel
        </button>

        <button
          type="button"
          onClick={onSubmit}
          disabled={saving}
          className="
            inline-flex w-full items-center justify-center gap-2 rounded-2xl
            bg-primary text-white hover:bg-primary/90 text-white px-5 py-2.5 text-sm font-semibold text-text-inverse
            shadow-md transition duration-200 ease-out
            hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-lg
            active:translate-y-0 active:bg-primary-active
            focus:outline-none focus:ring-4 focus:ring-focus/25
            disabled:cursor-not-allowed disabled:opacity-60
            cursor-pointer
            sm:w-auto
          "
        >
          {isEdit ? "✏️ Update Supplier" : "💾 Save Supplier"}
        </button>
      </div>
    </div>
  );
};

export default SupplierFormFooter;
