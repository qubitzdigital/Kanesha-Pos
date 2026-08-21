import React from "react";

const ReportSkeleton = () => {
  return (
    <>
      {/* Summary Skeleton */}
      <div className="p-5 bg-white border border-gray-200 shadow-md rounded-2xl sm:p-6 lg:p-7 animate-pulse">
        <div className="h-6 mb-5 bg-gray-200 rounded w-36"></div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="p-5 border border-gray-200 rounded-xl bg-gray-50"
            >
              <div className="h-4 mb-3 bg-gray-200 rounded w-24"></div>
              <div className="h-8 bg-gray-300 rounded w-32"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Breakdown Skeleton */}
      <div className="p-5 bg-white border border-gray-200 shadow-md rounded-2xl sm:p-6 lg:p-7 animate-pulse">
        <div className="h-6 mb-5 bg-gray-200 rounded w-36"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    </>
  );
};

export default ReportSkeleton;
