/**
 * Cache Control Middleware
 *
 * Sets appropriate Cache-Control headers for different types of endpoints
 * - Public GET endpoints: cache for specified TTL
 * - Mutations (POST/PUT/DELETE): no-store (do not cache)
 * - Auth-required endpoints: private cache only
 */

/**
 * Cache control configuration
 * Maps URL patterns to cache control directives
 */
const CACHE_CONFIG = {
  "/items": "no-store",
  "/suppliers": "no-store",
  "/customers": "no-store",
  "/settings": "no-store",
  "/dashboard": "no-store",
  "/sales": "no-store",
  "/expenses": "no-store",
  "/reports": "no-store",
  "/grns": "no-store",
  "/users": "no-store",
  "/auth": "no-store",
  "/purchases": "no-store",
  "/otp": "no-store",
};

/**
 * Get cache control header for a URL
 * @param {string} url - The request URL
 * @param {string} method - The HTTP method
 * @returns {string} Cache-Control header value
 */
function getCacheControl(url, method) {
  // Never cache mutations
  if (method !== "GET" && method !== "HEAD") {
    return "no-store";
  }

  // Check if URL matches any cache config pattern
  for (const [pattern, cacheDirective] of Object.entries(CACHE_CONFIG)) {
    if (url.includes(pattern)) {
      return cacheDirective;
    }
  }

  // Default: do not cache
  return "no-store";
}

/**
 * Middleware to set Cache-Control headers
 */
export function setCacheControl(req, res, next) {
  // Get the original send function
  const originalSend = res.send;

  // Override the send function to set cache headers
  res.send = function (data) {
    const cacheControl =
      res.statusCode >= 200 && res.statusCode < 400
        ? getCacheControl(req.path, req.method)
        : "no-store";

    if (!res.getHeader("Cache-Control")) {
      res.setHeader("Cache-Control", cacheControl);
    }

    return originalSend.call(this, data);
  };

  next();
}

export default setCacheControl;
