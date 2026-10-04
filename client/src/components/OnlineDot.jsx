import React from "react";

export const OnlineDot = ({ isOnline = false, className = "" }) => {
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-gray-900 flex-shrink-0 transition-colors ${
        isOnline ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
      } ${className}`}
      title={isOnline ? "Online" : "Offline"}
      aria-label={isOnline ? "User is online" : "User is offline"}
    />
  );
};

export default OnlineDot;
