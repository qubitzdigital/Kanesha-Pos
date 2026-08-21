// src/styles/colors.jsx
// Hardware POS System – Unified Color System (60 / 30 / 10 Rule)
// Palette source: E8F5E9 / A5D6A7 / 66BB6A / 1B5E20 (Material Green 50/200/400/900)
// Missing intermediate shades filled from the same Material Green scale for consistency.

export const colors = {
  /* ======================================================
     BACKGROUND / BASE (60%)
  ====================================================== */
  background: {
    primary: "#F2F9F2", // Main app background (very light green tint)
    secondary: "#FFFFFF", // Cards, modals, tables
    subtle: "#E8F5E9", // Alternate rows, separators
    disabled: "#D7E8D8",
  },

  /* ======================================================
     PRIMARY UI / STRUCTURE (30%)
  ====================================================== */
  primary: {
    DEFAULT: "#1B5E20", // Header, sidebar, main UI
    hover: "#164D1A", // Hover state
    active: "#0F3812", // Active / pressed
    light: "#2E7D32", // Lighter variant
    subtle: "#C8E6C9",
    // Background tint
  },

  /* ======================================================
     ACCENT / ACTION (10%)
  ====================================================== */
  accent: {
    DEFAULT: "#66BB6A", // Primary action color
    hover: "#4CAF50",
    active: "#388E3C",
    light: "#A5D6A7",
    subtle: "#E8F5E9",
  },

  error: {
    DEFAULT: "#DC2626",
    hover: "#B91C1C",
    active: "#991B1B",
    light: "#DC2626",
    subtle: "#FEE2E2",
  },

  /* ======================================================
     BUTTONS
  ====================================================== */
  /* ======================================================
   BUTTONS (FIXED – follows 60 / 30 / 10)
====================================================== */
  button: {
    primary: {
      bg: "#1B5E20", // primary.DEFAULT
      hover: "#164D1A", // primary.hover
      active: "#0F3812", // primary.active
      text: "#FFFFFF",
      disabled: "#8FBF92", // muted primary
    },

    secondary: {
      bg: "#66BB6A", // accent.DEFAULT
      hover: "#4CAF50", // accent.hover
      active: "#388E3C", // accent.active
      text: "#FFFFFF",
      disabled: "#A5D6A7", // accent.light
    },

    ghost: {
      bg: "transparent",
      hover: "#E8F5E9", // accent.subtle
      active: "#C8E6C9",
      text: "#388E3C",
    },
  },

  /* ======================================================
     TEXT
  ====================================================== */
  text: {
    primary: "#12261A", // Main content
    secondary: "#3F6B44", // Sub text
    tertiary: "#6B8F6E", // Muted
    inverse: "#FFFFFF", // On dark backgrounds
    disabled: "#A3C2A5",
    link: "#1B5E20",
    linkHover: "#164D1A",
  },

  /* ======================================================
     STATUS (GLOBAL)
  ====================================================== */
  status: {
    success: {
      DEFAULT: "#43A047",
      bg: "#E8F5E9",
      text: "#1B5E20",
    },

    warning: {
      DEFAULT: "#D97706",
      bg: "#FEF3C7",
      text: "#78350F",
    },
    pending: {
      DEFAULT: "#2563EB",
      bg: "#DBEAFE",
      text: "#1E3A8A",
    },
  },

  /* ======================================================
     BORDERS / RINGS
  ====================================================== */
  border: {
    DEFAULT: "#66BB6A",
    light: "#C8E6C9",
    dark: "#2E7D32",
    focus: "#66BB6A",
  },

  ring: {
    focus: "#66BB6A",
    subtle: "#C8E6C9",
  },

  /* ======================================================
     TABLE / POS ROW STATES
  ====================================================== */
  table: {
    header: "#E8F5E9",
    row: "#FFFFFF",
    rowAlt: "#F2F9F2",
    rowHover: "#C8E6C9",
    selected: "#A5D6A7",
  },

  /* ======================================================
     ICONS
  ====================================================== */
  icon: {
    primary: "#1B5E20",
    secondary: "#3F6B44",
    accent: "#66BB6A",
    success: "#43A047",
    error: "#DC2626",
  },

  /* ======================================================
     OVERLAYS / MODALS
  ====================================================== */
  overlay: {
    dark: "rgba(15, 36, 16, 0.6)",
    light: "rgba(255, 255, 255, 0.6)",
  },
};

export default colors;
