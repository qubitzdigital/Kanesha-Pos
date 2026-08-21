import React from "react";

const TrendEmptyState = () => {
  return (
    <div className="flex items-center justify-center py-10">
      <p className="text-sm sm:text-base text-text-secondary">
        No data available for the selected range.
      </p>
    </div>
  );
};

export default TrendEmptyState;
