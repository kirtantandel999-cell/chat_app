import React from "react";

export const TypingIndicator = ({ otherUserName = "Someone", isTyping = false }) => {
  if (!isTyping) return null;

  return (
    <div className="flex items-center space-x-2 px-4 py-2 text-xs text-gray-500 dark:text-gray-400 italic select-none transition-colors">
      <div className="flex space-x-1 items-center">
        <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" />
        <span
          className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
          style={{ animationDelay: "300ms" }}
        />
      </div>
      <span>{otherUserName} is typing...</span>
    </div>
  );
};

export default TypingIndicator;
