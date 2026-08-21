/**
 * Feature Permissions Configuration (Backend)
 * Defines all available system features
 */

export const AVAILABLE_FEATURES = [
  { id: "dashboard", label: "Dashboard", category: "Core" },
  { id: "pos", label: "POS (Point of Sale)", category: "Core" },
  { id: "inventory", label: "Inventory", category: "Stock" },
  { id: "suppliers", label: "Suppliers", category: "Stock" },
  { id: "purchases", label: "Purchases", category: "Stock" },
  { id: "customers", label: "Customers", category: "People" },
  { id: "reports", label: "Reports", category: "Analytics" },
  { id: "expenses", label: "Expenses", category: "Finance" },
  { id: "settings", label: "Settings", category: "Admin" },
  { id: "users", label: "User Management", category: "Admin" },
  { id: "return-exchange", label: "Return & Exchange", category: "Core" },
  { id: "clients", label: "Client Management", category: "Super Admin" },
];

/**
 * Default features for different roles
 */
export const DEFAULT_FEATURES_BY_ROLE = {
  cashier: ["dashboard", "pos", "customers", "return-exchange"],
  manager: [
    "dashboard",
    "pos",
    "inventory",
    "suppliers",
    "purchases",
    "customers",
    "reports",
    "expenses",
  ],
  admin: AVAILABLE_FEATURES.map((f) => f.id),
  owner: AVAILABLE_FEATURES.map((f) => f.id),
  // Superadmin: platform-level access, including the "clients" (add new client) feature
  superadmin: AVAILABLE_FEATURES.map((f) => f.id),
};

/**
 * Get features for a given role
 */
export const getFeaturesByRole = (role) => {
  return DEFAULT_FEATURES_BY_ROLE[role] || DEFAULT_FEATURES_BY_ROLE.cashier;
};

/**
 * Validate features array
 */
export const validateFeatures = (features) => {
  if (!Array.isArray(features)) {
    return false;
  }
  const validFeatureIds = new Set(AVAILABLE_FEATURES.map((f) => f.id));
  return features.every((f) => validFeatureIds.has(f));
};
