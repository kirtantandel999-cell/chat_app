import React from "react";
import { Outlet, Link } from "react-router-dom";
import ThemeToggle from "@/components/ThemeToggle";

export const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative transition-colors">
      {/* Top right theme toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-block text-3xl font-extrabold text-primary-600 dark:text-primary-400 tracking-tight">
          TaskFlow
        </Link>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Manage your tasks efficiently and stay organized.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white dark:bg-gray-900 py-8 px-4 shadow-sm border border-gray-200 dark:border-gray-800 rounded-lg sm:px-10 transition-colors">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
