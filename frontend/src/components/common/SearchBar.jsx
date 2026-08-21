import React from "react";

/**
 * Reusable search bar component with loading indicator
 * @param {string} value - Current search query value
 * @param {function} onChange - Handler for search input changes
 * @param {string} placeholder - Placeholder text for the search input
 * @param {boolean} isSearching - Whether search is in progress (shows spinner)
 * @param {string} className - Additional CSS classes
 */
const SearchBar = ({
  value,
  onChange,
  placeholder = "Search...",
  isSearching = false,
  className = "",
}) => {
  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
      />
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
    </div>
  );
};

export default SearchBar;
