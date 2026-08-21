import React from "react";

/**
 * Reusable page header component
 * @param {string} icon - Emoji or icon to display
 * @param {string} title - Page title
 * @param {string} description - Page description
 * @param {ReactNode} action - Optional action button or element (e.g., Add button)
 * @param {string} className - Additional CSS classes
 */
const PageHeader = ({
  icon = "📄",
  title = "Page Title",
  description = "",
  action = null,
  className = "",
}) => {
  return (
    <div className={`max-w-7xl mx-auto mb-8 ${className}`}>
      <div className="flex flex-col items-start justify-between gap-6 text-center md:flex-row md:items-center md:text-left">
        <div className="flex flex-col items-center w-full gap-4 md:w-auto sm:flex-row">
          <div className="flex items-center justify-center w-12 h-12 bg-transparent rounded-xl">
            <span className="text-2xl">{icon}</span>
          </div>
          <div className="w-full md:w-auto">
            <h1 className="text-3xl font-bold tracking-tight text-primary lg:text-4xl">
              {title}
            </h1>
            {description && (
              <p className="max-w-2xl mx-auto mt-2 text-sm text-accent md:text-base md:mx-0">
                {description}
              </p>
            )}
          </div>
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
};

export default PageHeader;
