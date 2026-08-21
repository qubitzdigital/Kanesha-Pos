/**
 * Cache Debug Utils
 *
 * Exposes cache management to the browser console for debugging
 * Only available in development mode
 */

import { apiCache } from "./apiCache";

export function setupCacheDebugTools() {
  if (import.meta.env.MODE === "development") {
    // Expose cache to window for debugging
    window.__apiCache = {
      // Get cache statistics
      getStats: () => {
        const stats = apiCache.getStats();
        console.table(
          stats.keys.map((key) => {
            const [url, params] = key.split(":");
            return { url, params: params || "{}" };
          }),
        );
        return stats;
      },

      // Clear all cache
      clear: () => {
        apiCache.clear();
        console.log("✓ All cache cleared");
      },

      // Invalidate by pattern
      invalidate: (pattern) => {
        apiCache.invalidate(pattern);
        console.log(`✓ Cache invalidated for pattern: ${pattern}`);
      },

      // Get specific cache entry
      get: (url, params = {}) => {
        const data = apiCache.get(url, params);
        if (data) {
          console.log("✓ Found in cache:", data);
          return data;
        } else {
          console.log("✗ Not found in cache");
          return null;
        }
      },

      // Manually set cache
      set: (url, params, data, ttl = 5 * 60 * 1000) => {
        apiCache.set(url, params, data, ttl);
        console.log(`✓ Cache set for ${url}`);
      },

      // Print cache info
      info: () => {
        const stats = apiCache.getStats();
        console.log(`
╔════════════════════════════════════════╗
║         API Cache Information          ║
╚════════════════════════════════════════╝
Total Cached Entries: ${stats.size}

Usage:
  window.__apiCache.getStats()      - Show all cached entries
  window.__apiCache.clear()         - Clear all cache
  window.__apiCache.invalidate(pattern) - Clear cache by pattern
  window.__apiCache.get(url, params) - Get cached data
  window.__apiCache.set(url, params, data, ttl) - Set cache manually
  window.__apiCache.info()          - Show this info
        `);
      },
    };

    console.log("🔧 Cache debug tools available at window.__apiCache");
    console.log("   Type: window.__apiCache.info() for help");
  }
}

export default setupCacheDebugTools;
