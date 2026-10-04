import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
} from "react";
import { useSocket } from "./SocketContext";
import useAuth from "@/hooks/useAuth";
import chatApi from "@/api/chatApi";

export const ChatContext = createContext(null);

const initialState = {
  conversations: [],
  onlineUserIds: [],
  typingMap: {}, // { [conversationId]: { [userId]: boolean } }
  activeConversationId: null,
  isLoadingConversations: true,
  error: null,
};

function chatReducer(state, action) {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoadingConversations: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload, isLoadingConversations: false };

    case "SET_CONVERSATIONS":
      return {
        ...state,
        conversations: action.payload,
        isLoadingConversations: false,
        error: null,
      };

    case "SET_ACTIVE_CONVERSATION":
      return { ...state, activeConversationId: action.payload };

    case "ADD_OR_UPDATE_CONVERSATION": {
      const conv = action.payload;
      const existingIndex = state.conversations.findIndex(
        (c) => c._id === conv._id
      );

      let updatedList;
      if (existingIndex >= 0) {
        // Update in-place or move to top
        updatedList = [...state.conversations];
        updatedList[existingIndex] = { ...updatedList[existingIndex], ...conv };
      } else {
        // Prepend new conversation
        updatedList = [conv, ...state.conversations];
      }

      return { ...state, conversations: updatedList };
    }

    case "HANDLE_NEW_MESSAGE": {
      const message = action.payload.message;
      const currentUserId = action.payload.currentUserId;
      const activeConvId = state.activeConversationId;

      const convIndex = state.conversations.findIndex(
        (c) => c._id === message.conversation
      );

      if (convIndex === -1) {
        return state;
      }

      const conv = state.conversations[convIndex];
      const isCurrentlyOpen = activeConvId === message.conversation;
      const isFromMe = message.sender._id === currentUserId;

      const newUnreadCount =
        isCurrentlyOpen || isFromMe
          ? conv.unreadCount || 0
          : (conv.unreadCount || 0) + 1;

      const updatedConv = {
        ...conv,
        lastMessage: message,
        updatedAt: message.createdAt || new Date().toISOString(),
        unreadCount: newUnreadCount,
      };

      // Move updated conversation to the top
      const otherConvs = state.conversations.filter(
        (c) => c._id !== message.conversation
      );

      return {
        ...state,
        conversations: [updatedConv, ...otherConvs],
      };
    }

    case "HANDLE_MESSAGE_DELETED": {
      const { conversationId, messageId } = action.payload;
      return {
        ...state,
        conversations: state.conversations.map((c) => {
          if (c._id === conversationId && c.lastMessage?._id === messageId) {
            return {
              ...c,
              lastMessage: {
                ...c.lastMessage,
                text: "",
                attachment: null,
                deletedAt: new Date().toISOString(),
              },
            };
          }
          return c;
        }),
      };
    }

    case "MARK_CONVERSATION_READ": {
      const convId = action.payload;
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c._id === convId ? { ...c, unreadCount: 0 } : c
        ),
      };
    }

    case "SET_ONLINE_USERS":
      return { ...state, onlineUserIds: action.payload };

    case "UPDATE_PRESENCE": {
      const { userId, isOnline } = action.payload;
      const currentOnline = new Set(state.onlineUserIds);
      if (isOnline) {
        currentOnline.add(userId);
      } else {
        currentOnline.delete(userId);
      }
      return { ...state, onlineUserIds: Array.from(currentOnline) };
    }

    case "UPDATE_TYPING": {
      const { conversationId, userId, isTyping } = action.payload;
      const currentConvTyping = state.typingMap[conversationId] || {};
      return {
        ...state,
        typingMap: {
          ...state.typingMap,
          [conversationId]: {
            ...currentConvTyping,
            [userId]: isTyping,
          },
        },
      };
    }

    default:
      return state;
  }
}

export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { socket, isConnected } = useSocket();
  const { user, isAuthenticated } = useAuth();

  // Load conversations on mount or authentication
  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated) return;
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const data = await chatApi.getConversations();
      dispatch({ type: "SET_CONVERSATIONS", payload: data });
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: err.message });
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Listen to Socket.IO events
  useEffect(() => {
    if (!socket || !isConnected || !user) return;

    // Presence: initial list of online users
    socket.on("presence:init", (onlineIds) => {
      dispatch({ type: "SET_ONLINE_USERS", payload: onlineIds });
    });

    // Presence: individual online/offline updates
    socket.on("presence:update", ({ userId, isOnline }) => {
      dispatch({ type: "UPDATE_PRESENCE", payload: { userId, isOnline } });
    });

    // Typing status updates
    socket.on("typing:update", ({ conversationId, userId, isTyping }) => {
      dispatch({
        type: "UPDATE_TYPING",
        payload: { conversationId, userId, isTyping },
      });
    });

    // New message arrived
    socket.on("message:new", (message) => {
      dispatch({
        type: "HANDLE_NEW_MESSAGE",
        payload: { message, currentUserId: user._id },
      });
    });

    // Message deleted event
    socket.on("message:deleted", ({ conversationId, messageId }) => {
      dispatch({
        type: "HANDLE_MESSAGE_DELETED",
        payload: { conversationId, messageId },
      });
    });

    // Message deleted for me event (multi-tab sync)
    socket.on("message:deleted_for_me", () => {
      fetchConversations();
    });

    // Conversation metadata updated
    socket.on("conversation:updated", ({ conversationId, lastMessage, updatedAt }) => {
      dispatch({
        type: "ADD_OR_UPDATE_CONVERSATION",
        payload: { _id: conversationId, lastMessage, updatedAt },
      });
    });

    return () => {
      socket.off("presence:init");
      socket.off("presence:update");
      socket.off("typing:update");
      socket.off("message:new");
      socket.off("message:deleted");
      socket.off("message:deleted_for_me");
      socket.off("conversation:updated");
    };
  }, [socket, isConnected, user]);

  const setActiveConversation = useCallback((conversationId) => {
    dispatch({ type: "SET_ACTIVE_CONVERSATION", payload: conversationId });
  }, []);

  const markConversationRead = useCallback(async (conversationId) => {
    dispatch({ type: "MARK_CONVERSATION_READ", payload: conversationId });
    try {
      await chatApi.markRead(conversationId);
    } catch (err) {
      console.warn("Error marking conversation read:", err);
    }
  }, []);

  const addConversation = useCallback((conversation) => {
    dispatch({ type: "ADD_OR_UPDATE_CONVERSATION", payload: conversation });
  }, []);

  const isUserOnline = useCallback(
    (userId) => {
      if (!userId) return false;
      return state.onlineUserIds.includes(userId.toString());
    },
    [state.onlineUserIds]
  );

  const getTypingUsersForConversation = useCallback(
    (conversationId, otherUserId) => {
      if (!conversationId || !otherUserId) return false;
      return Boolean(
        state.typingMap[conversationId]?.[otherUserId.toString()]
      );
    },
    [state.typingMap]
  );

  return (
    <ChatContext.Provider
      value={{
        conversations: state.conversations,
        isLoadingConversations: state.isLoadingConversations,
        error: state.error,
        activeConversationId: state.activeConversationId,
        setActiveConversation,
        markConversationRead,
        addConversation,
        refetchConversations: fetchConversations,
        isUserOnline,
        getTypingUsersForConversation,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};

export default ChatContext;
