import React from "react";

export const Avatar = ({ name = "", size = "md", className = "" }) => {
  const getInitials = (str) => {
    if (!str) return "?";
    const parts = str.trim().split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  };

  return (
    <div
      className={`rounded-full bg-primary-600 text-white font-semibold flex items-center justify-center flex-shrink-0 select-none shadow-sm ${
        sizeClasses[size] || sizeClasses.md
      } ${className}`}
      aria-hidden="true"
    >
      {getInitials(name)}
    </div>
  );
};

export default Avatar;
