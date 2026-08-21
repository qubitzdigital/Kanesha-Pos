import React from "react";

/**
 * Reusable action button component
 * @param {string} label - Button label
 * @param {function} onClick - Click handler
 * @param {string} variant - Button variant: 'primary', 'success', 'danger', 'warning', 'info'
 * @param {string} size - Button size: 'sm', 'md', 'lg'
 * @param {boolean} disabled - Whether button is disabled
 * @param {string} icon - Optional icon/emoji
 * @param {string} className - Additional CSS classes
 */
const ActionButton = ({
  label,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  icon = null,
  className = "",
}) => {
  const variantClasses = {
    primary:
      "bg-gradient-to-r from-primary to-primary/90 text-white hover:shadow-xl",
    success: "bg-green-50 text-green-700 hover:bg-green-100",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    warning: "bg-yellow-50 text-yellow-700 hover:bg-yellow-100",
    info: "bg-blue-50 text-blue-700 hover:bg-blue-100",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const selectedVariant = variantClasses[variant] || variantClasses.primary;
  const selectedSize = sizeClasses[size] || sizeClasses.md;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 ${selectedSize} ${selectedVariant} font-semibold rounded-xl shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {icon && <span>{icon}</span>}
      <span>{label}</span>
    </button>
  );
};

export default ActionButton;
