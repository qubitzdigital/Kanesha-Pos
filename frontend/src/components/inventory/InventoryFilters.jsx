import React from "react";
import { SearchBar } from "../common";

const InventoryFilters = ({
  q,
  setQ,
  isSearching,
  filterCategory,
  setFilterCategory,
  tableCategories,
  onSearch,
  onClear,
}) => {
  return (
    <div className="p-4 border-b border-gray-200 sm:p-6 bg-gradient-to-r from-gray-50 to-white">
      <div className="flex flex-col items-stretch justify-between gap-4 md:flex-row md:items-center">
        <div className="flex flex-col flex-1 gap-3 sm:flex-row">
          <SearchBar
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, barcode, brand, category..."
            isSearching={isSearching}
          />
          <div className="flex w-full gap-2 sm:w-auto">
            <button
              className="h-10 px-4 text-white transition-all bg-blue-500 border-2 border-blue-600 cursor-pointer rounded-xl hover:bg-blue-600 active:scale-95"
              onClick={onSearch}
            >
              Search
            </button>
            <button
              className="h-10 px-4 text-gray-800 transition-all bg-gray-200 border-2 border-gray-300 cursor-pointer rounded-xl hover:bg-gray-300 active:scale-95"
              onClick={onClear}
            >
              Clear
            </button>
          </div>
        </div>

        <div className="w-full md:w-64">
          <select
            className="w-full h-10 pl-4 pr-10 text-sm bg-white border-2 border-gray-300 rounded-xl"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {tableCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default InventoryFilters;
