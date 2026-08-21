import React from "react";
import CloseButton from "../../../common/CloseButton";

const FormHeader = ({ editingId, onClose }) => {
  return (
    <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <span className="text-lg sm:text-xl">📦</span>
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              {editingId ? "Update Item" : "Add New Item"}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Master data only — stock & batches are managed via
              GRN/Sales/Adjustments.
            </p>
          </div>
        </div>

        <CloseButton
          onClick={onClose}
          size="sm"
          variant="subtle"
          ariaLabel="Close form"
        />
      </div>
    </div>
  );
};

export default FormHeader;
