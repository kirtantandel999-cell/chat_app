import React from "react";

export const Card = ({ children, className = "", ...props }) => {
  return (
    <div
      className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm p-4 sm:p-6 transition-colors ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
