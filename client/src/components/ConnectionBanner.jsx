import React from "react";
import { useSocket } from "@/context/SocketContext";

export const ConnectionBanner = () => {
  const { isConnected } = useSocket();

  if (isConnected) return null;

  return (
    <div
      role="status"
      className="bg-yellow-50 dark:bg-yellow-950/50 border-b border-yellow-200 dark:border-yellow-800/80 px-4 py-1.5 text-xs text-yellow-800 dark:text-yellow-200 text-center flex items-center justify-center space-x-2 transition-colors"
    >
      <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
      <span>Connecting to real-time chat server...</span>
    </div>
  );
};

export default ConnectionBanner;
