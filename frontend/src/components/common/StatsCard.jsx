import React from "react";

/**
 * Reusable statistics card component
 * @param {string} label - Label for the stat
 * @param {string|number} value - Value to display
 * @param {string} color - Color variant: 'blue', 'red', 'green', 'yellow', 'purple', 'gray'
 * @param {string} className - Additional CSS classes
 */
const StatsCard = ({ label, value, color = "blue", className = "" }) => {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-800",
    red: "bg-red-100 text-red-800",
    green: "bg-green-100 text-green-800",
    yellow: "bg-yellow-100 text-yellow-800",
    purple: "bg-purple-100 text-purple-800",
    gray: "bg-gray-100 text-gray-800",
  };

  const selectedColor = colorClasses[color] || colorClasses.blue;

  return (
    <div
      className={`px-3 py-1.5 ${selectedColor} rounded-lg text-sm font-medium ${className}`}
    >
      {label}: {value}
    </div>
  );
};

export default StatsCard;
