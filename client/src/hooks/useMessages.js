import { useState, useEffect, useCallback, useRef } from "react";
import chatApi from "@/api/chatApi";
import { useSocket } from "@/context/SocketContext";
import { useChat } from "@/context/ChatContext";
import useAuth from "@/hooks/useAuth";

export const useMessages = (conversationId) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingOlder, setIsFetchingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  const { socket, isConnected } = useSocket();
  const { markConversationRead, setActiveConversation } = useChat();
  const { user } = useAuth();

  const conversationIdRef = useRef(conversationId);
  conversationIdRef.current = conversationId;

  // Initial load when conversationId changes
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    setActiveConversation(conversationId);
    markConversationRead(conversationId);

    let isIgnored = false;
    setIsLoading(true);
    setError(null);
    setHasMore(true);

    chatApi
      .getMessages(conversationId, { limit: 30 })
      .then((data) => {
        if (!isIgnored) {
          setMessages(data);
          if (data.length < 30) {
            setHasMore(false);
          }
        }
      })
      .catch((err) => {
        if (!isIgnored) {
          setError(err.message || "Failed to load messages");
        }
      })
      .finally(() => {
        if (!isIgnored) {
          setIsLoading(false);
        }
      });

    return () => {
      isIgnored = true;
      setActiveConversation(null);
    };
  }, [conversationId, markConversationRead, setActiveConversation]);

  // Listen for real-time incoming messages for this conversation
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewMessage = (newMessage) => {
      if (newMessage.conversation === conversationIdRef.current) {
        setMessages((prev) => {
          // Avoid duplicates if already present
          if (prev.some((m) => m._id === newMessage._id)) {
            return prev;
          }
          return [...prev, newMessage];
        });

        // If message is from the other person, mark read immediately
        if (newMessage.sender._id !== user?._id) {
          markConversationRead(conversationIdRef.current);
        }
      }
    };

    socket.on("message:new", handleNewMessage);

    const handleMessageDeleted = ({ conversationId: cId, messageId }) => {
      if (cId === conversationIdRef.current) {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === messageId
              ? { ...m, text: "", attachment: null, deletedAt: new Date().toISOString() }
              : m
          )
        );
      }
    };

    const handleMessageDeletedForMe = ({ conversationId: cId, messageId }) => {
      if (cId === conversationIdRef.current) {
        setMessages((prev) => prev.filter((m) => m._id !== messageId));
      }
    };

    socket.on("message:deleted", handleMessageDeleted);
    socket.on("message:deleted_for_me", handleMessageDeletedForMe);

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("message:deleted", handleMessageDeleted);
      socket.off("message:deleted_for_me", handleMessageDeletedForMe);
    };
  }, [socket, isConnected, user?._id, markConversationRead]);

  // Load older messages (cursor pagination based on oldest message ID)
  const loadOlderMessages = useCallback(async () => {
    if (isFetchingOlder || !hasMore || messages.length === 0 || !conversationId) {
      return;
    }

    setIsFetchingOlder(true);
    const oldestMessageId = messages[0]._id;

    try {
      const olderMessages = await chatApi.getMessages(conversationId, {
        before: oldestMessageId,
        limit: 30,
      });

      if (olderMessages.length < 30) {
        setHasMore(false);
      }

      setMessages((prev) => [...olderMessages, ...prev]);
    } catch (err) {
      console.warn("Failed to load older messages:", err);
    } finally {
      setIsFetchingOlder(false);
    }
  }, [conversationId, hasMore, isFetchingOlder, messages]);

  // Send message via socket with acknowledgement
  const sendMessage = useCallback(
    async (text) => {
      if (!socket || !isConnected) {
        throw new Error("Chat server disconnected. Reconnecting...");
      }

      return new Promise((resolve, reject) => {
        socket.emit(
          "message:send",
          {
            conversationId,
            text,
          },
          (response) => {
            if (response?.ok) {
              resolve(response.message);
            } else {
              reject(new Error(response?.error || "Failed to send message"));
            }
          }
        );
      });
    },
    [socket, isConnected, conversationId]
  );

  // Send attachment via REST multipart
  const sendAttachment = useCallback(
    async (file, text, onProgress) => {
      if (!conversationId) return;
      const message = await chatApi.sendAttachment(
        conversationId,
        file,
        text,
        onProgress
      );
      setMessages((prev) => {
        if (prev.some((m) => m._id === message._id)) {
          return prev;
        }
        return [...prev, message];
      });
      return message;
    },
    [conversationId]
  );

  // Delete message via REST API (Delete for everyone)
  const deleteMessage = useCallback(async (messageId) => {
    const res = await chatApi.deleteMessage(messageId);
    const updated = res.message;
    setMessages((prev) =>
      prev.map((m) => (m._id === messageId ? { ...m, ...updated } : m))
    );
    return updated;
  }, []);

  // Delete message via REST API (Delete for me)
  const deleteForMe = useCallback(async (messageId) => {
    await chatApi.deleteForMe(messageId);
    setMessages((prev) => prev.filter((m) => m._id !== messageId));
  }, []);

  return {
    messages,
    isLoading,
    isFetchingOlder,
    hasMore,
    error,
    sendMessage,
    sendAttachment,
    deleteMessage,
    deleteForMe,
    loadOlderMessages,
  };
};

export default useMessages;
