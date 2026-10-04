import React from "react";
import { Link } from "react-router-dom";

export const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4 transition-colors">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-extrabold text-primary-600 dark:text-primary-400">
          404
        </h1>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Page not found
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <div>
          <Link
            to="/chat"
            className="inline-flex items-center justify-center px-4 py-2 min-h-[40px] text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:ring-offset-gray-900 transition-colors duration-150"
          >
            Back to Chat
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
