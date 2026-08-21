/**
 * useCache Hook
 *
 * Custom hook for managing cached API calls
 * Automatically caches GET requests and manages cache invalidation
 */

import { useCallback } from "react";
import {
  apiCache,
  getTTLForURL,
  invalidateCacheForRequest,
} from "../utils/apiCache";

/**
 * Hook to make cached API calls
 * @param {Object} api - The API client instance
 * @param {boolean} enableCache - Whether to enable caching (default: true)
 */
export const useCache = (api, enableCache = true) => {
  /**
   * Make a cached GET request
   */
  const cachedGet = useCallback(
    async (url, params = {}) => {
      if (!enableCache || !api) {
        return api.get(url, { params });
      }

      // Check cache first
      const cached = apiCache.get(url, params);
      if (cached) {
        return { data: cached };
      }

      // Fetch from API
      const response = await api.get(url, { params });

      // Cache the response
      if (response?.data) {
        const ttl = getTTLForURL(url);
        apiCache.set(url, params, response.data, ttl);
      }

      return response;
    },
    [api, enableCache],
  );

  /**
   * Make a request and handle cache invalidation
   */
  const cachedRequest = useCallback(
    async (method, url, data = null) => {
      if (!api) return null;

      let response;
      if (method === "GET") {
        response = await cachedGet(url, data || {});
      } else {
        response = await api[method.toLowerCase()](url, data);
        // Invalidate cache for mutations
        invalidateCacheForRequest(method, url);
      }

      return response;
    },
    [api, cachedGet],
  );

  /**
   * Clear all cache
   */
  const clearCache = useCallback(() => {
    apiCache.clear();
  }, []);

  /**
   * Invalidate specific cache pattern
   */
  const invalidateCache = useCallback((pattern) => {
    apiCache.invalidate(pattern);
  }, []);

  return {
    cachedGet,
    cachedRequest,
    clearCache,
    invalidateCache,
    getCacheStats: () => apiCache.getStats(),
  };
};

export default useCache;
