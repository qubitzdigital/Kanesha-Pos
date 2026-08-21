import React from "react";
import AppLoader from "../../common/AppLoader";
import CloseButton from "../../common/CloseButton";
import { formatCurrency } from "../../../utils/currency";

const GRNListModal = ({
  open,
  supplier,
  grnsList,
  loading,
  onClose,
  onSelectGRN,
  currencySymbol = "Rs.",
  currencyPosition = "before",
}) => {
  if (!open || !supplier) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/75 backdrop-blur-sm animate-[fadeIn_180ms_ease-out]">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-gray-200 bg-background-secondary shadow-lg max-h-[90vh] flex flex-col animate-[popIn_220ms_ease-out]">
        {/* Top accent bar for consistency with GRNFormModal */}
        <div className="h-1.5 w-full bg-accent" />

        {/* Soft ambient glows for consistency */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-64 h-64 rounded-full -top-24 -right-24 bg-accent-subtle blur-3xl opacity-70" />
          <div className="absolute rounded-full -bottom-28 -left-28 h-72 w-72 bg-primary-subtle blur-3xl opacity-60" />
        </div>

        {/* Header (non-scrollable, sticky) */}
        <div className="sticky top-0 z-20 border-b border-gray-200 bg-background-secondary/90 backdrop-blur-md">
          <div className="flex items-center justify-between p-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                GRNs - {supplier.name}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {grnsList.length} Goods Received Notes
              </p>
            </div>
            <CloseButton
              onClick={onClose}
              size="md"
              ariaLabel="Close GRN list"
            />
          </div>
        </div>

        {/* Scrollable body */}
        <div className="relative flex-1 px-4 py-4 overflow-y-auto max-h-[calc(85vh-12rem)]">
          <div className="rounded-2xl bg-background-secondary shadow-soft">
            <div className="p-2 sm:p-3 md:p-4">
              {loading ? (
                <div className="flex justify-center items-center py-10">
                  <AppLoader
                    open
                    variant="inline"
                    title="Loading GRNs"
                    subtitle="Fetching goods received notes"
                  />
                </div>
              ) : grnsList.length === 0 ? (
                <div className="py-10 text-center text-gray-500">
                  No GRNs found
                </div>
              ) : (
                <div className="space-y-3">
                  {grnsList.map((grn) => {
                    const statusClasses =
                      grn.status === "posted"
                        ? "bg-green-100 text-green-700 border border-green-200"
                        : "bg-amber-100 text-amber-700 border border-amber-200";

                    return (
                      <div
                        key={grn._id}
                        className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-primary hover:shadow-sm"
                        onClick={() => onSelectGRN(grn)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="font-semibold text-gray-900">
                                {grn.grnNo}
                              </div>
                              <span
                                className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${statusClasses}`}
                              >
                                {(grn.status || "draft").toUpperCase()}
                              </span>
                            </div>
                            <div className="mt-1 text-sm text-gray-500">
                              Date: {new Date(grn.grnDate).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-primary">
                              {formatCurrency(
                                Number(grn.grandTotal || 0),
                                currencySymbol,
                                currencyPosition,
                              )}
                            </div>
                            <div className="mt-1 text-sm text-gray-500">
                              {grn.lines?.length || 0} items
                            </div>
                          </div>
                        </div>
                        {grn.remarks && (
                          <div className="mt-2 text-sm text-gray-600 line-clamp-2">
                            {grn.remarks}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GRNListModal;
