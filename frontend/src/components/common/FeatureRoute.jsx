import React from "react";
import { userHasFeatureAccess } from "../../utils/permissionHelper.js";

/**
 * FeatureRoute - Wrapper component that checks if user has access to a specific feature
 * If user doesn't have access, displays an AccessDenied message
 *
 * @param {Object} props
 * @param {string} props.featureId - The feature ID to check access for
 * @param {React.ReactNode} props.children - Component to render if user has access
 * @param {Object} props.user - Current user object with permissions array
 * @param {React.ReactNode} props.fallback - Optional fallback component to show when access denied
 *
 * @example
 * <FeatureRoute featureId="pos" user={user}>
 *   <POSPage />
 * </FeatureRoute>
 */
export default function FeatureRoute({ featureId, children, user, fallback }) {
  // Check if user has access to this feature
  const hasAccess = userHasFeatureAccess(user, featureId);

  if (!hasAccess) {
    // Show fallback component or default access denied message
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4v2m0 4v2m0-16h0m0 2h0m0 4h0m0 4h0"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Access Denied
            </h1>
            <p className="text-gray-600 mb-6">
              You don't have permission to access this feature.
            </p>
            <p className="text-sm text-gray-500">
              Feature ID:{" "}
              <code className="bg-gray-100 px-2 py-1 rounded">{featureId}</code>
            </p>
            <div className="mt-8">
              <a
                href="/"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Go Home
              </a>
            </div>
          </div>
        </div>
      )
    );
  }

  // User has access, render the component
  return children;
}
