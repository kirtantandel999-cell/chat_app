import React from "react";

export const Alert = ({
  type = "info",
  message,
  children,
  action,
  className = "",
}) => {
  const typeStyles = {
    success:
      "bg-green-50 border-green-200 text-green-800 dark:bg-green-950/40 dark:border-green-800 dark:text-green-200",
    error:
      "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-800 dark:text-red-200",
    warning:
      "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950/40 dark:border-yellow-800 dark:text-yellow-200",
    info:
      "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-200",
  };

  return (
    <div
      role="alert"
      className={`border rounded-lg p-4 text-sm flex items-start justify-between transition-colors ${
        typeStyles[type] || typeStyles.info
      } ${className}`}
    >
      <div className="flex-1">
        {message && <p>{message}</p>}
        {children}
      </div>
      {action && <div className="ml-4 flex-shrink-0">{action}</div>}
    </div>
  );
};

export default Alert;
