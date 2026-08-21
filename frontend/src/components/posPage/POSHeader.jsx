import React from "react";
import { PageHeader } from "../common";

const POSHeader = ({ isOffline, vatRate }) => {
  return (
    <PageHeader
      icon="🧾"
      title="Point of Sale Billing"
      description="Barcode scanning, VAT compliance, and real-time calculations."
      action={
        <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
          <div
            className={`px-4 py-1.5 rounded-full text-xs font-semibold ${
              isOffline
                ? "bg-error-subtle text-error-hover border border-error/30"
                : "bg-status-success-bg text-status-success border border-status-success/30"
            }`}
          >
            {isOffline ? "🔴 Offline Mode" : "🟢 Online Mode"}
          </div>
          <div className="px-4 py-1.5 bg-status-pending-bg text-status-pending border border-status-pending/30 rounded-full text-xs font-semibold">
            VAT: {(vatRate * 100).toFixed(0)}%
          </div>
        </div>
      }
    />
  );
};

export default POSHeader;
