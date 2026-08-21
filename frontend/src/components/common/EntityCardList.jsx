import React from "react";

/**
 * Reusable card list for mobile/tablet views.
 * Accepts an array of entities and a renderCard function.
 * Optionally accepts an empty state component.
 */
const EntityCardList = ({ items, renderCard, emptyState, className = "" }) => {
  if (!items || items.length === 0) {
    return emptyState || null;
  }
  return (
    <div className={`divide-y divide-gray-100 ${className}`}>
      {items.map((item, idx) => (
        <div key={item._id || idx}>{renderCard(item, idx)}</div>
      ))}
    </div>
  );
};

export default EntityCardList;
