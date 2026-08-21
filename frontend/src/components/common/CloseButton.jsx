import React from "react";
import { motion } from "framer-motion";

/**
 * Standard Close Button Component
 * Provides consistent close button styling across the application
 *
 * Properties:
 * - onClick: Function to call when button is clicked
 * - size: 'sm' (h-8 w-8), 'md' (h-10 w-10), 'lg' (h-11 w-11) - default: 'md'
 * - variant: 'default' or 'subtle' - default: 'default'
 * - ariaLabel: Accessibility label - default: 'Close'
 * - isAnimated: Enable framer-motion animations - default: false
 * - className: Additional CSS classes
 * - disabled: Disable the button - default: false
 * - title: Tooltip title
 * - type: Button type - default: 'button'
 */
const CloseButton = React.forwardRef(
  (
    {
      onClick,
      size = "md",
      variant = "default",
      ariaLabel = "Close",
      isAnimated = false,
      className = "",
      disabled = false,
      title,
      type = "button",
    },
    ref,
  ) => {
    // Size mapping
    const sizeClasses = {
      sm: "h-8 w-8",
      md: "h-10 w-10",
      lg: "h-11 w-11",
    };

    // Variant mapping
    const variantClasses = {
      default:
        "border border-gray-200 bg-background-secondary text-text-tertiary hover:bg-background-subtle hover:text-text-primary hover:shadow-md active:scale-[0.98] focus:ring-focus/20",
      subtle:
        "text-text-tertiary hover:text-text-primary hover:bg-background-subtle active:scale-[0.98] focus:ring-focus/20",
    };

    const baseClasses = `
      inline-flex items-center justify-center rounded-2xl
      transition-all duration-200 ease-out
      focus:outline-none focus:ring-2
      cursor-pointer
      ${sizeClasses[size]}
      ${variantClasses[variant]}
      ${disabled ? "opacity-60 cursor-not-allowed" : ""}
      ${className}
    `;

    const iconClasses =
      size === "sm" ? "text-base" : size === "lg" ? "text-lg" : "text-base";

    const commonProps = {
      ref,
      type,
      onClick,
      aria_label: ariaLabel,
      ariaLabel,
      title: title || ariaLabel,
      disabled,
      className: baseClasses,
    };

    // Use motion.button if animation is enabled
    if (isAnimated) {
      return (
        <motion.button
          {...commonProps}
          whileHover={!disabled ? { y: -1 } : {}}
          whileTap={!disabled ? { scale: 0.98 } : {}}
        >
          <span className={`leading-none ${iconClasses}`}>✕</span>
        </motion.button>
      );
    }

    return (
      <button {...commonProps}>
        <span className={`leading-none ${iconClasses}`}>✕</span>
      </button>
    );
  },
);

CloseButton.displayName = "CloseButton";

export default CloseButton;
