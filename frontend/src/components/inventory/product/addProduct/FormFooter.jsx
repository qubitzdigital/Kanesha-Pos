import React from "react";

const FormFooter = ({ saving, editingId, onCancel, onSave }) => {
  return (
    <div className="sticky bottom-0 p-4 bg-white border-t border-gray-200 sm:p-6">
      <div className="flex flex-col justify-end gap-3 sm:flex-row">
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 font-medium text-gray-700 transition-all border-2 border-gray-300 rounded-xl hover:bg-gray-50 active:scale-95 cursor-pointer"
          onClick={onCancel}
        >
          ✕ Cancel
        </button>

        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 font-medium text-white transition-all bg-gradient-to-r from-primary to-primary/90 rounded-xl hover:shadow-lg active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          onClick={onSave}
          disabled={saving}
        >
          {editingId ? "✏️ Update Item" : "📦 Create Item"}
        </button>
      </div>
    </div>
  );
};

export default FormFooter;
