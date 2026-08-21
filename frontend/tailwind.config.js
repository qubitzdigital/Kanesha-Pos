/** @type {import('tailwindcss').Config} */

import colors from "./src/themes/colors.js";

export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: {
          primary: colors.background.primary,
          secondary: colors.background.secondary,
          subtle: colors.background.subtle,
          disabled: colors.background.disabled,
        },

        primary: {
          DEFAULT: colors.primary.DEFAULT,
          hover: colors.primary.hover,
          active: colors.primary.active,
          light: colors.primary.light,
          subtle: colors.primary.subtle,
        },

        accent: {
          DEFAULT: colors.accent.DEFAULT,
          hover: colors.accent.hover,
          active: colors.accent.active,
          light: colors.accent.light,
          subtle: colors.accent.subtle,
        },

        error: {
          DEFAULT: colors.error.DEFAULT,
          hover: colors.error.hover,
          active: colors.error.active,
          light: colors.error.light,
          subtle: colors.error.subtle,
        },

        button: {
          primary: {
            bg: colors.button.primary.bg,
            hover: colors.button.primary.hover,
            active: colors.button.primary.active,
            text: colors.button.primary.text,
            disabled: colors.button.primary.disabled,
          },
          secondary: {
            bg: colors.button.secondary.bg,
            hover: colors.button.secondary.hover,
            active: colors.button.secondary.active,
            text: colors.button.secondary.text,
            disabled: colors.button.secondary.disabled,
          },
          ghost: {
            bg: colors.button.ghost.bg,
            hover: colors.button.ghost.hover,
            active: colors.button.ghost.active,
            text: colors.button.ghost.text,
          },
        },

        text: {
          primary: colors.text.primary,
          secondary: colors.text.secondary,
          tertiary: colors.text.tertiary,
          inverse: colors.text.inverse,
          disabled: colors.text.disabled,
          link: colors.text.link,
          linkHover: colors.text.linkHover,
        },

        status: {
          success: {
            DEFAULT: colors.status.success.DEFAULT,
            bg: colors.status.success.bg,
            text: colors.status.success.text,
          },

          warning: {
            DEFAULT: colors.status.warning.DEFAULT,
            bg: colors.status.warning.bg,
            text: colors.status.warning.text,
          },
          pending: {
            DEFAULT: colors.status.pending.DEFAULT,
            bg: colors.status.pending.bg,
            text: colors.status.pending.text,
          },
        },

        border: {
          light: colors.border.light,
          DEFAULT: colors.border.DEFAULT,
          dark: colors.border.dark,
          focus: colors.border.focus,
        },

        ring: {
          focus: colors.ring.focus,
          subtle: colors.ring.subtle,
        },

        table: {
          header: colors.table.header,
          row: colors.table.row,
          rowAlt: colors.table.rowAlt,
          rowHover: colors.table.rowHover,
          selected: colors.table.selected,
        },

        icon: {
          primary: colors.icon.primary,
          secondary: colors.icon.secondary,
          accent: colors.icon.accent,
          success: colors.icon.success,
          error: colors.icon.error,
        },

        overlay: {
          dark: colors.overlay.dark,
          light: colors.overlay.light,
        },
      },

      // ✅ Nice default UI primitives for a POS
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
      },

      // Soft, modern shadows (no hard-coded colors; uses CSS var strategy)
      // Tailwind shadows don't support theme colors directly, so we keep neutral.
      boxShadow: {
        soft: "0 10px 30px -12px rgba(0,0,0,0.18)",
        card: "0 12px 36px -18px rgba(0,0,0,0.22)",
        float: "0 18px 50px -24px rgba(0,0,0,0.28)",
      },
    },
  },

  plugins: [],
};
