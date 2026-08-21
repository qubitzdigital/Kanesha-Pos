import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Custom hook for incremental prefix search with debouncing
 * @param {Array} items - Array of items to search
 * @param {Function} getSearchableFields - Function that returns array of searchable field values for an item
 * @param {number} debounceMs - Debounce delay in milliseconds (default: 300)
 * @returns {Object} - { query, setQuery, filteredItems, isSearching }
 */
export const usePrefixSearch = (
  items = [],
  getSearchableFields,
  debounceMs = 300
) => {
  const [query, setQuery] = useState("");
  const [filteredItems, setFilteredItems] = useState(items);
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimerRef = useRef(null);

  // Debounced search effect
  useEffect(() => {
    setIsSearching(true);

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      const trimmedQuery = query.trim();

      // If no query, return all items
      if (!trimmedQuery) {
        setFilteredItems(items);
        setIsSearching(false);
        return;
      }

      // Perform case-insensitive prefix matching
      const lowerQuery = trimmedQuery.toLowerCase();
      const results = items.filter((item) => {
        const searchableFields = getSearchableFields(item);
        return searchableFields.some((fieldValue) => {
          if (!fieldValue) return false;
          const lowerValue = String(fieldValue).toLowerCase();
          return lowerValue.startsWith(lowerQuery);
        });
      });

      setFilteredItems(results);
      setIsSearching(false);
    }, debounceMs);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, items, getSearchableFields, debounceMs]);

  return {
    query,
    setQuery,
    filteredItems,
    isSearching,
  };
};
