import React from "react";

const GRNFormMetadata = ({
  existingGRN,
  form,
  fieldsDisabled,
  onHeaderChange,
}) => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {existingGRN && (
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">
            GRN No
          </label>
          <input
            type="text"
            value={existingGRN.grnNo || "Auto-generated"}
            disabled
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 cursor-not-allowed text-sm text-gray-600"
          />
        </div>
      )}

      <div>
        <label className="block mb-2 -mt-3 font-medium text-gray-700 text4-sm">
          GRN Date
        </label>
        <input
          type="date"
          name="grnDate"
          value={form.grnDate}
          onChange={onHeaderChange}
          disabled={fieldsDisabled}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
        />
      </div>
    </div>
  );
};

export default GRNFormMetadata;
