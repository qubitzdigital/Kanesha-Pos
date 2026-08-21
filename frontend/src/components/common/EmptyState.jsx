import React from "react";

/**
 * Reusable empty state component
 * @param {string} icon - Emoji or icon to display
 * @param {string} title - Main title text
 * @param {string} description - Description text
 * @param {ReactNode} action - Optional action button or element
 * @param {string} className - Additional CSS classes
 */
const EmptyState = ({
  icon = "📭",
  title = "No items found",
  description = "Try adjusting your search or filters",
  action = null,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 text-center ${className}`}
    >
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
        <span className="text-2xl">{icon}</span>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-gray-600 mt-1 text-sm">{description}</p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};

export default EmptyState;
