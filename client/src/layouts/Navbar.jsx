import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import ThemeToggle from "@/components/ThemeToggle";

export const Navbar = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const navLinkClass = ({ isActive }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
      isActive
        ? "bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 font-semibold"
        : "text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800"
    }`;

  const mobileNavLinkClass = ({ isActive }) =>
    `block px-3 py-2 rounded-lg text-base font-medium transition-colors duration-150 ${
      isActive
        ? "bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 font-semibold"
        : "text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800"
    }`;

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Brand & Nav */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link
                to="/chat"
                className="text-xl font-bold text-primary-600 dark:text-primary-400 tracking-tight"
              >
                TaskFlow Chat
              </Link>
            </div>
            <div className="hidden md:ml-8 md:flex md:space-x-2 md:items-center">
              <NavLink to="/chat" className={navLinkClass}>
                Chat
              </NavLink>
              <NavLink to="/profile" className={navLinkClass}>
                Profile
              </NavLink>
            </div>
          </div>

          {/* User profile, ThemeToggle & Logout */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <ThemeToggle />
            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
              {user?.name || "User"}
            </span>
            <button
              onClick={logout}
              type="button"
              className="px-3 py-1.5 min-h-[40px] text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 transition-colors"
            >
              Logout
            </button>
          </div>

          {/* Mobile hamburger button */}
          <div className="flex items-center space-x-2 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              aria-label="Toggle Navigation Menu"
              aria-expanded={isOpen}
              className="inline-flex items-center justify-center p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 min-h-[40px] min-w-[40px]"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {isOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 pt-2 pb-3 space-y-1">
          <NavLink
            to="/chat"
            onClick={() => setIsOpen(false)}
            className={mobileNavLinkClass}
          >
            Chat
          </NavLink>
          <NavLink
            to="/profile"
            onClick={() => setIsOpen(false)}
            className={mobileNavLinkClass}
          >
            Profile
          </NavLink>
          <div className="pt-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {user?.name || "User"}
            </span>
            <button
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              type="button"
              className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg min-h-[40px]"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
