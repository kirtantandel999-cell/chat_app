import React from "react";
import Button from "./Button";

export const Pagination = ({ page = 1, totalPages = 1, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <nav
      className="flex items-center justify-between border-t border-gray-200 dark:border-gray-800 px-4 py-3 sm:px-6 mt-6 transition-colors"
      aria-label="Pagination"
    >
      <div className="flex-1 flex justify-between sm:justify-end items-center space-x-3">
        <span className="text-sm text-gray-700 dark:text-gray-300">
          Page <span className="font-medium text-gray-900 dark:text-gray-100">{page}</span> of{" "}
          <span className="font-medium text-gray-900 dark:text-gray-100">{totalPages}</span>
        </span>
        <div className="space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Previous Page"
          >
            Previous
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            aria-label="Next Page"
          >
            Next
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Pagination;
