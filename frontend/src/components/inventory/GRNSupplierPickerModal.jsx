import React, { useState, useMemo } from "react";
import CloseButton from "../common/CloseButton";

// Small picker shown when GRN is opened from the Inventory page (no supplier
// context yet). User picks the supplier they're receiving goods from, then
// the standard GRN "Receive Goods" popup opens (same one used from Suppliers).
const GRNSupplierPickerModal = ({
  open,
  item,
  suppliers = [],
  onSelect,
  onClose,
}) => {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter((s) => (s.name || "").toLowerCase().includes(q));
  }, [suppliers, query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-3 bg-white/75 backdrop-blur-sm">
      <div className="w-full max-w-md max-h-[80vh] overflow-hidden bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col">
        <div className="flex items-start justify-between gap-3 p-5 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Receive Goods</h3>
            {item?.sku && (
              <p className="text-xs text-gray-600 mt-0.5">
                Select a supplier for{" "}
                <span className="font-medium">{item.sku}</span>
              </p>
            )}
          </div>
          <CloseButton
            onClick={onClose}
            size="sm"
            ariaLabel="Close supplier picker"
          />
        </div>

        <div className="p-4 border-b border-gray-100">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search suppliers..."
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="overflow-y-auto p-2">
          {filtered.length === 0 && (
            <p className="px-3 py-6 text-sm text-center text-gray-500">
              No suppliers found.
            </p>
          )}

          {filtered.map((s) => (
            <button
              key={s._id}
              type="button"
              onClick={() => onSelect(s)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {s.name}
                </div>
                {s.phone && (
                  <div className="text-xs text-gray-500">{s.phone}</div>
                )}
              </div>
              <span className="text-xs text-primary font-semibold">
                Select →
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GRNSupplierPickerModal;
