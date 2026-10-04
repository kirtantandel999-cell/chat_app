import React from "react";

export const Footer = () => {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-auto transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500 dark:text-gray-400">
        <p>&copy; {new Date().getFullYear()} TaskFlow. All rights reserved.</p>
        <p className="mt-2 sm:mt-0">Built with Node.js & React</p>
      </div>
    </footer>
  );
};

export default Footer;
