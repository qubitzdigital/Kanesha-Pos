import React from "react";

const CustomerStatsBar = ({ customers, searchQuery }) => {
  const activeCount = customers.filter((c) => c.currentBalance === 0).length;
  const dueCount = customers.filter((c) => c.currentBalance > 0).length;
  const displayCount = customers.length;

  return (
    <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
      <div className="flex items-center justify-between flex-col sm:flex-row gap-4 sm:gap-0 items-start sm:items-center">
        <div className="w-full sm:w-auto">
          <h2 className="text-lg font-semibold text-gray-900">
            Customer Directory
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {displayCount} customer{displayCount !== 1 ? "s" : ""}
            {searchQuery && " matching search"}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-start sm:justify-end w-full sm:w-auto">
          <div className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
            Active: {activeCount}
          </div>
          <div className="px-3 py-1.5 bg-red-100 text-red-800 rounded-lg text-sm font-medium">
            Due: {dueCount}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerStatsBar;
