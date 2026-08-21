import React from "react";

const TrackingMode = ({ form, errs, updateField }) => {
  const trackingOptional = Boolean(form.hasVariants);

  return (
    <div className="border-t border-gray-200 pt-6">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
        Tracking Mode{" "}
        {trackingOptional ? (
          <span className="text-xs font-normal text-gray-500">
            (optional — this item has sizes)
          </span>
        ) : (
          <span className="text-red-500">*</span>
        )}
      </h3>

      {trackingOptional && (
        <div className="mb-3 p-3 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-800">
          Leave both unchecked to enter stock directly per size below. Only tick
          "Batch-tracked" if you also want each size's stock to come from
          batches received via GRN instead.
        </div>
      )}

      {errs.tracking && (
        <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {errs.tracking}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl">
          <input
            type="checkbox"
            checked={form.isBatchTracked}
            onChange={(e) => updateField("isBatchTracked", e.target.checked)}
            className="h-5 w-5 text-primary rounded focus:ring-primary cursor-pointer"
          />
          <div>
            <div className="font-medium text-gray-900">Batch-tracked</div>
            <div className="text-xs text-gray-500">
              Requires batch number + expiry in GRN.
            </div>
          </div>
        </label>

        <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl">
          <input
            type="checkbox"
            checked={form.isSerialTracked}
            onChange={(e) => updateField("isSerialTracked", e.target.checked)}
            className="h-5 w-5 text-primary rounded focus:ring-primary cursor-pointer"
          />
          <div>
            <div className="font-medium text-gray-900">Serial-tracked</div>
            <div className="text-xs text-gray-500">
              Use only if you have a serial model/workflow.
            </div>
          </div>
        </label>
      </div>
    </div>
  );
};

export default TrackingMode;
