import React from "react";
import colors from "../../../themes/colors";
const GRNFormActions = ({
  saving,
  isEditable,
  existingGRN,
  onCancel,
  onSubmit,
}) => {
  return (
    <div className="flex justify-end gap-3 pt-1 ">
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border cursor-pointer border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition"
      >
        ✕ Cancel
      </button>

      <button
        type={onSubmit ? "button" : "submit"}
        onClick={onSubmit}
        disabled={saving || !isEditable}
        className="inline-flex items-center justify-center gap-2 bg-primary text-white cursor-pointer hover:bg-primary/90 px-5 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-70 disabled:cursor-not-allowed"
        title="Saves the GRN and updates stock immediately"
      >
        {existingGRN
          ? "✏️ Update GRN (Update Stock)"
          : "💾 Save GRN (Update Stock)"}
      </button>
    </div>
  );
};

export default GRNFormActions;
