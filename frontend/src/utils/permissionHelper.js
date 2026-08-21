/**
 * Frontend Permissions Helper
 * Utilities to check user feature access on the frontend
 */

/**
 * Check if user has access to a feature
 * @param {Object} user - The current user object
 * @param {string} featureId - The feature ID to check
 * @returns {boolean} - Whether user has access
 */
export const userHasFeatureAccess = (user, featureId) => {
  if (!user) return false;

  // Super admin has full platform access, including "clients"
  if (user.role === "superadmin") {
    return true;
  }

  // Owners and admins have full access to regular shop features,
  // but never to the super-admin-only "clients" feature
  if (user.role === "owner" || user.role === "admin") {
    return featureId !== "clients";
  }

  // Check permissions array
  return (
    Array.isArray(user.permissions) && user.permissions.includes(featureId)
  );
};

/**
 * Get available features for a user
 * @param {Object} user - The current user object
 * @returns {Array} - Array of feature IDs user has access to
 */
export const getUserFeatures = (user) => {
  if (!user) return [];

  // Super admin: platform-level access, including "clients"
  if (user.role === "superadmin") {
    return [
      "dashboard",
      "pos",
      "inventory",
      "suppliers",
      "purchases",
      "customers",
      "reports",
      "expenses",
      "settings",
      "users",
      "return-exchange",
      "invoices",
      "clients",
    ];
  }

  // Owners and admins have all regular shop features
  if (user.role === "owner" || user.role === "admin") {
    return [
      "dashboard",
      "pos",
      "inventory",
      "suppliers",
      "purchases",
      "customers",
      "reports",
      "expenses",
      "settings",
      "users",
      "return-exchange",
      "invoices",
    ];
  }

  return Array.isArray(user.permissions) ? user.permissions : [];
};

/**
 * Check if user can access multiple features
 * @param {Object} user - The current user object
 * @param {Array} featureIds - Array of feature IDs
 * @returns {boolean} - Whether user has access to all features
 */
export const userHasAllFeatures = (user, featureIds) => {
  return featureIds.every((featureId) => userHasFeatureAccess(user, featureId));
};

/**
 * Check if user can access any of the features
 * @param {Object} user - The current user object
 * @param {Array} featureIds - Array of feature IDs
 * @returns {boolean} - Whether user has access to any feature
 */
export const userHasAnyFeature = (user, featureIds) => {
  return featureIds.some((featureId) => userHasFeatureAccess(user, featureId));
};
