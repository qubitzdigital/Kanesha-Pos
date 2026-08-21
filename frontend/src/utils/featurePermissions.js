/**
 * Feature Permissions Configuration
 * Defines all available system features that can be assigned to users
 */

export const AVAILABLE_FEATURES = [
  {
    id: "dashboard",
    label: "Dashboard",
    description: "View sales overview and key metrics",
    icon: "📊",
    category: "Core",
  },
  {
    id: "pos",
    label: "POS (Point of Sale)",
    description: "Create and manage sales transactions",
    icon: "🛒",
    category: "Core",
  },
  {
    id: "inventory",
    label: "Inventory",
    description: "Manage stock, items, and GRN",
    icon: "📦",
    category: "Stock",
  },
  {
    id: "suppliers",
    label: "Suppliers",
    description: "Manage supplier information",
    icon: "🏭",
    category: "Stock",
  },
  {
    id: "purchases",
    label: "Purchases",
    description: "Create and manage purchase orders",
    icon: "📥",
    category: "Stock",
  },
  {
    id: "customers",
    label: "Customers",
    description: "Manage customer information and credit",
    icon: "👥",
    category: "People",
  },
  {
    id: "reports",
    label: "Reports",
    description: "View sales, inventory, and financial reports",
    icon: "📈",
    category: "Analytics",
  },
  {
    id: "expenses",
    label: "Expenses",
    description: "Track and manage business expenses",
    icon: "💸",
    category: "Finance",
  },
  {
    id: "settings",
    label: "Settings",
    description: "Configure shop and system settings",
    icon: "⚙️",
    category: "Admin",
  },
  {
    id: "users",
    label: "User Management",
    description: "Create and manage staff accounts",
    icon: "👤",
    category: "Admin",
  },
  {
    id: "return-exchange",
    label: "Return & Exchange",
    description: "Process product returns and exchanges",
    icon: "🔄",
    category: "Core",
  },
  {
    id: "invoices",
    label: "Invoices",
    description: "View and search past sale invoices",
    icon: "🧾",
    category: "Core",
  },
  {
    id: "clients",
    label: "Client Management",
    description: "Onboard and manage new client businesses",
    icon: "🏢",
    category: "Super Admin",
  },
];

/**
 * Default features for different roles
 */
export const DEFAULT_FEATURES_BY_ROLE = {
  cashier: ["dashboard", "pos", "customers", "return-exchange", "invoices"],
  manager: [
    "dashboard",
    "pos",
    "inventory",
    "suppliers",
    "purchases",
    "customers",
    "reports",
    "expenses",
    "invoices",
  ],
  admin: AVAILABLE_FEATURES.map((f) => f.id),
  owner: AVAILABLE_FEATURES.map((f) => f.id),
  superadmin: AVAILABLE_FEATURES.map((f) => f.id),
};

/**
 * Get features for a given role
 */
export const getFeaturesByRole = (role) => {
  return DEFAULT_FEATURES_BY_ROLE[role] || DEFAULT_FEATURES_BY_ROLE.cashier;
};

/**
 * Check if user has access to a feature
 */
export const hasFeatureAccess = (userPermissions, featureId) => {
  if (!Array.isArray(userPermissions)) {
    return false;
  }
  return userPermissions.includes(featureId);
};

/**
 * Get feature metadata by ID
 */
export const getFeatureById = (featureId) => {
  return AVAILABLE_FEATURES.find((f) => f.id === featureId);
};
