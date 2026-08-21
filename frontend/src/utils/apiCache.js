/**
 * API Cache Service
 *
 * Provides in-memory caching for API calls with:
 * - Configurable TTL (Time To Live)
 * - Cache key generation
 * - Cache invalidation
 * - Query parameter hashing
 */

class APICache {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes default
  }

  /**
   * Generate cache key from URL and params
   */
  generateKey(url, params = {}) {
    const paramStr = JSON.stringify(params);
    return `${url}||${paramStr}`;
  }

  /**
   * Get cached data if valid
   */
  get(url, params = {}) {
    const key = this.generateKey(url, params);
    const cached = this.cache.get(key);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    // Remove expired cache
    if (cached) {
      this.cache.delete(key);
      if (this.timers.has(key)) {
        clearTimeout(this.timers.get(key));
        this.timers.delete(key);
      }
    }

    return null;
  }

  /**
   * Set cache with TTL
   */
  set(url, params, data, ttl = this.defaultTTL) {
    const key = this.generateKey(url, params);
    const expiresAt = Date.now() + ttl;

    // Clear existing timer
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    // Store cache
    this.cache.set(key, { data, expiresAt });

    // Auto-cleanup after TTL
    const timer = setTimeout(() => {
      this.cache.delete(key);
      this.timers.delete(key);
    }, ttl);

    this.timers.set(key, timer);
  }

  /**
   * Clear cache by URL pattern (supports wildcards with *)
   */
  invalidate(urlPattern) {
    const keys = Array.from(this.cache.keys());
    // Escape all regex special chars except *, then replace * with .*
    const escaped = urlPattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
    const regex = new RegExp(`^${escaped}`);

    keys.forEach((key) => {
      const url = key.split("||")[0];
      if (regex.test(url)) {
        this.cache.delete(key);
        if (this.timers.has(key)) {
          clearTimeout(this.timers.get(key));
          this.timers.delete(key);
        }
      }
    });
  }

  /**
   * Clear all cache
   */
  clear() {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.cache.clear();
    this.timers.clear();
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Create singleton instance
export const apiCache = new APICache();

/**
 * Cache configuration for different endpoints
 * Format: { urlPattern: ttlInMs }
 */
export const CACHE_CONFIG = {
  // Dashboard endpoints - 2 minutes (frequently updated data)
  "/dashboard/.*": 2 * 60 * 1000,

  // Sales data - 3 minutes
  "/sales": 3 * 60 * 1000,

  // Expenses data - 3 minutes
  "/expenses": 3 * 60 * 1000,

  // Master data (slower to change) - 10 minutes
  "/items.*": 10 * 60 * 1000,
  "/suppliers.*": 10 * 60 * 1000,
  "/customers.*": 10 * 60 * 1000,
  "/settings": 10 * 60 * 1000,

  // Low frequency updates - 15 minutes
  "/users": 15 * 60 * 1000,
  "/grns.*": 5 * 60 * 1000, // GRNs can change more frequently
};

/**
 * Get TTL for a URL
 */
export function getTTLForURL(url) {
  for (const [pattern, ttl] of Object.entries(CACHE_CONFIG)) {
    const regex = new RegExp(`^${pattern}`);
    if (regex.test(url)) {
      return ttl;
    }
  }
  return apiCache.defaultTTL;
}

/**
 * Invalidation patterns for mutations
 * Maps endpoint patterns to cache patterns that should be invalidated
 * Pattern format: "METHOD:/path/pattern" -> ["cache_pattern1", "cache_pattern2"]
 * Use .* to match path segments and parameters
 */
export const INVALIDATION_MAP = {
  // POST /sales invalidates dashboard, sales, items (stock deducted) and customers (credit balance updated)
  "POST:/sales": ["/dashboard/*", "/sales", "/items*", "/customers*"],

  // PUT /sales/:id invalidates dashboard, sales, items and customers cache
  "PUT:/sales/*": ["/dashboard/*", "/sales", "/items*", "/customers*"],

  // POST /expenses invalidates dashboard and expenses cache
  "POST:/expenses": ["/dashboard/*", "/expenses"],

  // PUT /expenses/:id invalidates dashboard and expenses cache
  "PUT:/expenses/*": ["/dashboard/*", "/expenses"],

  // DELETE /expenses/:id invalidates dashboard and expenses cache
  "DELETE:/expenses/*": ["/dashboard/*", "/expenses"],

  // Item operations invalidate items cache
  "POST:/items": ["/items*", "/dashboard/*"],
  "PUT:/items/*": ["/items*", "/dashboard/*"],
  "PATCH:/items/*": ["/items*", "/dashboard/*"],
  "DELETE:/items/*": ["/items*", "/dashboard/*"],

  // Supplier operations invalidate suppliers cache
  "POST:/suppliers": ["/suppliers*", "/dashboard/*"],
  "PUT:/suppliers/*": ["/suppliers*", "/dashboard/*"],
  "DELETE:/suppliers/*": ["/suppliers*", "/dashboard/*"],

  // Customer operations invalidate customers cache (if cached)
  "POST:/customers": ["/customers*", "/dashboard/*"],
  "PUT:/customers/*": ["/customers*", "/dashboard/*"],
  "DELETE:/customers/*": ["/customers*", "/dashboard/*"],

  // Purchase operations
  "POST:/purchases": ["/purchases*", "/dashboard/*"],
  "PUT:/purchases/*": ["/purchases*", "/dashboard/*"],
  "DELETE:/purchases/*": ["/purchases*", "/dashboard/*"],

  // Settings updates
  "PUT:/settings": ["/settings"],
  "POST:/settings": ["/settings"],

  // User operations
  "POST:/users": ["/users*"],
  "PUT:/users/*": ["/users*"],
  "DELETE:/users/*": ["/users*"],

  // GRN operations - affect dashboard and inventory
  "POST:/grns": ["/grns*", "/dashboard/*", "/items*"],
  "PUT:/grns/*": ["/grns*", "/dashboard/*", "/items*"],
  "DELETE:/grns/*": ["/grns*", "/dashboard/*", "/items*"],

  // GRN post - updates item stock levels and supplier balance
  "POST:/grns/*/post": ["/grns*", "/dashboard/*", "/items*", "/suppliers*"],

  // Pending sale operations
  "DELETE:/sales/pending/*": ["/sales/pending"],

  // Return operations - restore stock and affect dashboard stats
  "POST:/returns": ["/dashboard/*", "/items*"],

  // Supplier payment - updates supplier currentBalance
  "POST:/suppliers/*/pay": ["/suppliers*", "/dashboard/*"],

  // Customer payment - updates customer credit balance
  "POST:/customers/*/receive-payment": ["/customers*", "/dashboard/*"],
};

/**
 * Invalidate cache based on request method and URL
 */
export function invalidateCacheForRequest(method, url) {
  // Extract base path from URL (remove query params and hash)
  const basePath = url.split("?")[0].split("#")[0];

  for (const [pattern, invalidPatterns] of Object.entries(INVALIDATION_MAP)) {
    const [patternMethod, patternPath] = pattern.split(":");

    // Escape regex special chars except *, then expand * to .*
    const regexPattern = patternPath
      .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
      .replace(/\*/g, ".*");

    const pathRegex = new RegExp(`^${regexPattern}$`);

    if (patternMethod === method && pathRegex.test(basePath)) {
      invalidPatterns.forEach((p) => apiCache.invalidate(p));
    }
  }
}

export default apiCache;
