// SupplierSearchBar.jsx
import React from "react";

const SupplierSearchBar = ({
  query,
  onQueryChange,
  isSearching,
  onRefresh,
  loading,
  filteredCount,
  totalCount,
}) => {
  return (
    <div className="flex flex-col gap-3 p-4 border-b border-gray-200 bg-background-secondary sm:p-6 md:flex-row md:items-center">
      <div className="relative flex-1">
        <input
          className={[
            "w-full rounded-2xl px-4 py-3 text-sm",
            "bg-background-secondary text-text-primary placeholder:text-text-tertiary",
            "border border-gray-200 shadow-sm",
            "focus:outline-none focus:ring-2 focus:ring-focus/20 focus:border-primary",
            "transition-all duration-200 ease-out hover:shadow-md",
          ].join(" ")}
          placeholder="Search suppliers..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
      </div>

      <button
        onClick={onRefresh}
        disabled={loading}
        className={[
          "inline-flex items-center justify-center gap-2",
          "rounded-2xl px-4 py-3 text-sm font-semibold",
          "border border-gray-200 bg-background-secondary text-text-secondary",
          "shadow-sm transition-all duration-200 ease-out",
          "hover:bg-background-subtle hover:shadow-md",
          "active:scale-[0.99]",
          "focus:outline-none focus:ring-2 focus:ring-focus/20",
          "disabled:opacity-70 disabled:cursor-not-allowed",
          "cursor-pointer",
        ].join(" ")}
      >
        ↻ Refresh
      </button>

      <div className="text-xs font-medium text-text-tertiary md:text-right">
        {filteredCount} of {totalCount}
      </div>
    </div>
  );
};

export default SupplierSearchBar;
