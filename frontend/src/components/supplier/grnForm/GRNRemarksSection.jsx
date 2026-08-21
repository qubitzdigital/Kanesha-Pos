import React from "react";

const GRNRemarksSection = ({ form, onHeaderChange }) => {
  return (
    <div>
      <label className="block mb-2 text-sm font-medium text-gray-700">
        Remarks
      </label>
      <textarea
        name="remarks"
        value={form.remarks}
        onChange={onHeaderChange}
        rows={3}
        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm resize-none"
        placeholder="Any additional notes..."
      />
    </div>
  );
};

export default GRNRemarksSection;
