import React from "react";

export const Spinner = ({ fullScreen = false, size = "md", className = "" }) => {
  const sizeClasses = {
    sm: "w-5 h-5 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
  };

  const spinnerElement = (
    <div
      role="status"
      className="inline-flex items-center justify-center"
      aria-label="Loading"
    >
      <div
        className={`${
          sizeClasses[size] || sizeClasses.md
        } border-primary-200 dark:border-primary-900 border-t-primary-600 dark:border-t-primary-400 rounded-full animate-spin motion-reduce:animate-none ${className}`}
      />
      <span className="sr-only">Loading...</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/80 dark:bg-gray-950/80 fixed inset-0 z-50">
        {spinnerElement}
      </div>
    );
  }

  return <div className="flex items-center justify-center p-4">{spinnerElement}</div>;
};

export default Spinner;
