/**
 * API Interceptor Setup
 *
 * Automatically caches GET requests and invalidates cache on mutations
 * This should be called when initializing the API client
 */

import { apiCache, getTTLForURL, invalidateCacheForRequest } from "./apiCache";

/**
 * Setup caching interceptors for an axios instance
 * @param {Object} axiosInstance - The axios instance to setup
 * @param {Object} options - Configuration options
 */
export function setupCacheInterceptors(axiosInstance, options = {}) {
  const { enableCaching = true } = options;

  if (!enableCaching) {
    return;
  }

  /**
   * Response interceptor - cache GET requests
   */
  axiosInstance.interceptors.response.use(
    (response) => {
      const config = response.config;
      const method = config.method?.toUpperCase() || "GET";
      const url = config.url;
      const params = config.params || {};

      if (method === "GET" && response.data) {
        const ttl = getTTLForURL(url);
        apiCache.set(url, params, response.data, ttl);
      }

      return response;
    },
    (error) => {
      return Promise.reject(error);
    },
  );

  /**
   * Request interceptor - check cache and invalidate on mutations
   */
  axiosInstance.interceptors.request.use(
    (config) => {
      const method = config.method?.toUpperCase() || "GET";
      const url = config.url;
      const params = config.params || {};

      // Check cache for GET requests
      if (method === "GET") {
        const cached = apiCache.get(url, params);
        if (cached) {
          // Return cached data without making the request
          // We'll handle this in the response interceptor
          config.cached = true;
          return config;
        }
      } else {
        // Invalidate cache for mutations (POST, PUT, DELETE, etc.)
        invalidateCacheForRequest(method, url);
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    },
  );
}

/**
 * Create a wrapped axios instance with caching
 * @param {Object} axiosInstance - The base axios instance
 * @param {Object} options - Configuration options
 */
export function wrapAxiosWithCache(axiosInstance, options = {}) {
  setupCacheInterceptors(axiosInstance, options);

  // Return the wrapped instance with additional cache methods
  return {
    ...axiosInstance,
    clearCache: () => apiCache.clear(),
    invalidateCache: (pattern) => apiCache.invalidate(pattern),
    getCacheStats: () => apiCache.getStats(),
  };
}

export default setupCacheInterceptors;
