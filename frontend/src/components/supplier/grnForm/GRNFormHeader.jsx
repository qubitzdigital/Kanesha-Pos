import React from "react";

const GRNFormHeader = ({
  existingGRN,
  supplier,
  grnDate,
  handleHeaderChange,
  fieldsDisabled,
}) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-primary">
        {existingGRN ? "Edit GRN for" : "Create Goods Received Note (GRN) for"}

        {supplier && (
          <span className="ml-3 text-sm font-semibold text-primary">
            — {supplier.name}
          </span>
        )}
      </h2>

      {!existingGRN && (
        <div className="p-3 mb-0 border border-blue-200 rounded-lg bg-blue-50">
          <p className="text-sm text-primary">
            GRN Number will be automatically generated when you save this GRN
          </p>
        </div>
      )}

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
          {existingGRN && (
            <div>
              <label className="block mb-0 text-sm font-medium text-gray-700">
                GRN Date
              </label>
              <input
                type="date"
                name="grnDate"
                value={grnDate}
                onChange={handleHeaderChange}
                disabled={fieldsDisabled}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GRNFormHeader;
