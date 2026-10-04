import { useEffect, useRef, useCallback } from "react";
import { useSocket } from "@/context/SocketContext";

export const useTyping = (conversationId) => {
  const { socket, isConnected } = useSocket();
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  const stopTyping = useCallback(() => {
    if (!isTypingRef.current || !socket || !isConnected || !conversationId) {
      return;
    }

    socket.emit("typing:stop", { conversationId });
    isTypingRef.current = false;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [socket, isConnected, conversationId]);

  const handleInputChange = useCallback(() => {
    if (!socket || !isConnected || !conversationId) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit("typing:start", { conversationId });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 2500);
  }, [socket, isConnected, conversationId, stopTyping]);

  useEffect(() => {
    return () => {
      stopTyping();
    };
  }, [conversationId, stopTyping]);

  return {
    handleInputChange,
    stopTyping,
  };
};

export default useTyping;
