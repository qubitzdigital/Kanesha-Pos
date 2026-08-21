import React, { useMemo, useState } from "react";
import { formatCurrency } from "../../utils/currency";

const CustomerSelector = ({
  customers = [],
  value = null,
  onChange,
  onAddNew,
  showBalances = false,
  compact = false,
  currencySymbol = "Rs.",
  currencyPosition = "before",
}) => {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => {
      const name = (c.name || "").toLowerCase();
      const phone = (c.phone || "").toLowerCase();
      return name.includes(q) || phone.includes(q);
    });
  }, [customers, search]);

  return (
    <div className="space-y-2">
      <input
        className={`w-full border rounded-xl px-3 py-2 text-xs md:text-sm bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-primary ${
          compact ? "h-9" : ""
        }`}
        placeholder="Search customer by name or phone"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="overflow-auto bg-white border border-gray-200 max-h-48 rounded-xl">
        {filtered.length === 0 ? (
          <p className="px-3 py-2 text-[11px] text-gray-500">
            No customers found. Add a new customer.
          </p>
        ) : (
          filtered.map((c) => {
            const isActive = value && value._id === c._id;
            return (
              <button
                key={c._id}
                type="button"
                className={`w-full text-left px-3 py-1.5 text-[11px] md:text-xs hover:bg-soft cursor-pointer transition-colors ${
                  isActive
                    ? "bg-primary/10 font-semibold text-primary border-l-4 border-primary pl-2"
                    : "text-gray-700"
                }`}
                onClick={() => onChange && onChange(isActive ? null : c)}
              >
                <div className="flex items-center justify-between">
                  <span>
                    {c.name}
                    {c.phone ? ` • ${c.phone}` : ""}
                  </span>
                  {showBalances && typeof c.currentBalance === "number" && (
                    <span
                      className={`text-[10px] font-semibold ${
                        c.currentBalance > 0 ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {formatCurrency(
                        c.currentBalance,
                        currencySymbol,
                        currencyPosition,
                      )}
                    </span>
                  )}
                </div>
                {c.type && (
                  <div className="text-[10px] text-gray-500">
                    {c.type === "cash"
                      ? "Cash only"
                      : c.type === "credit"
                        ? "Credit"
                        : "Cash & Credit"}
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>

      {onAddNew && (
        <button
          type="button"
          onClick={onAddNew}
          className="inline-flex items-center justify-center px-3 py-2 text-xs text-white border cursor-pointer bg-accent rounded-xl border-accent md:text-sm hover:bg-accent/90"
        >
          + Add new customer
        </button>
      )}
    </div>
  );
};

export default CustomerSelector;
