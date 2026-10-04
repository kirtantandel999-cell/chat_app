import React from "react";

export const Badge = ({ variant = "status", value, className = "" }) => {
  const normalizedValue = (value || "").toLowerCase();

  const statusStyles = {
    todo: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    "in-progress":
      "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    done: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  };

  const priorityStyles = {
    low: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    medium:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
    high: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  };

  const styles =
    variant === "priority"
      ? priorityStyles[normalizedValue] ||
        "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
      : statusStyles[normalizedValue] ||
        "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";

  const displayLabels = {
    todo: "To Do",
    "in-progress": "In Progress",
    done: "Done",
    low: "Low",
    medium: "Medium",
    high: "High",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${styles} ${className}`}
    >
      {displayLabels[normalizedValue] || value}
    </span>
  );
};

export default Badge;
