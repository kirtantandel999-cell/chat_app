import React from "react";

export const Button = ({
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled = false,
  type = "button",
  onClick,
  children,
  className = "",
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:ring-offset-gray-900 min-h-[40px]";

  const variantClasses = {
    primary: "bg-primary-600 text-white hover:bg-primary-700 shadow-sm",
    secondary:
      "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700 shadow-sm",
    danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
  };

  const disabledClasses =
    disabled || isLoading ? "opacity-50 cursor-not-allowed" : "";

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant] || variantClasses.primary} ${
        sizeClasses[size] || sizeClasses.md
      } ${disabledClasses} ${className}`}
      {...props}
    >
      {isLoading && (
        <span
          className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin motion-reduce:animate-none"
          role="status"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
};

export default Button;
