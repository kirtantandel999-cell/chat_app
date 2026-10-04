import React from "react";
import Card from "./Card";

export const StatCard = ({ label, value, color = "primary" }) => {
  const colorStyles = {
    primary:
      "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/50",
    blue: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50",
    green:
      "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/50",
    gray: "text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800",
  };

  return (
    <Card className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
      </div>
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
          colorStyles[color] || colorStyles.primary
        }`}
      >
        {value}
      </div>
    </Card>
  );
};

export default StatCard;
