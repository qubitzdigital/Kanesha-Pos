import React from "react";
import { colors } from "../../themes/colors";

const POSActionsSection = ({
  canSavePending,
  canSaveCredit,
  canSavePaid,
  onSavePending,
  onSaveCredit,
  onSavePaid,
}) => {
  return (
    <div className="p-4 border-t border-border-light sm:p-6 bg-background-subtle">
      <div className="flex flex-col justify-end gap-3 md:flex-row md:gap-4">
        <button
          type="button"
          disabled={!canSavePending}
          onClick={onSavePending}
          className={`px-6 sm:px-8 bg-primary text-white hover:bg-primary/90 py-3 sm:py-4 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 inline-flex items-center justify-center gap-2 ${
            canSavePending ? "cursor-pointer" : "opacity-50 cursor-not-allowed"
          }`}
        >
          📋 Save as Pending
        </button>

        <button
          type="button"
          disabled={!canSaveCredit}
          onClick={onSaveCredit}
          className={`bg-primary text-white hover:bg-primary/90 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 inline-flex items-center justify-center gap-2 ${
            canSaveCredit ? "cursor-pointer" : "opacity-50 cursor-not-allowed"
          }`}
        >
          💳 Save as Credit Sale
        </button>

        <button
          type="button"
          disabled={!canSavePaid}
          onClick={onSavePaid}
          className={`bg-primary text-white hover:bg-primary/90 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 inline-flex items-center justify-center gap-2 ${
            canSavePaid ? "cursor-pointer" : "opacity-50 cursor-not-allowed"
          }`}
        >
          🖨️ Save & Print
        </button>
      </div>
    </div>
  );
};

export default POSActionsSection;
