import React from "react";
import { useChat } from "@/context/ChatContext";
import useAuth from "@/hooks/useAuth";
import useMessages from "@/hooks/useMessages";
import useTyping from "@/hooks/useTyping";
import Avatar from "./Avatar";
import OnlineDot from "./OnlineDot";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import TypingIndicator from "./TypingIndicator";
import Spinner from "./Spinner";
import Alert from "./Alert";

export const ChatWindow = ({ conversationId, onBack }) => {
  const { user } = useAuth();
  const { conversations, isUserOnline, getTypingUsersForConversation } = useChat();

  const conversation = conversations.find((c) => c._id === conversationId);
  const otherParticipant = conversation?.participants?.find(
    (p) => p._id !== user?._id
  );

  const {
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
  } = useMessages(conversationId);

  const { handleInputChange, stopTyping } = useTyping(conversationId);

  const isOnline = isUserOnline(otherParticipant?._id);
  const isOtherTyping = getTypingUsersForConversation(
    conversationId,
    otherParticipant?._id
  );

  const [deleteError, setDeleteError] = React.useState(null);

  const handleSend = async (text) => {
    stopTyping();
    try {
      await sendMessage(text);
    } catch (err) {
      console.error("Send message error:", err);
    }
  };

  const handleSendAttachment = async (file, text, onProgress) => {
    stopTyping();
    return await sendAttachment(file, text, onProgress);
  };

  const handleDeleteMessage = async (messageId) => {
    setDeleteError(null);
    try {
      await deleteMessage(messageId);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to delete message";
      setDeleteError(msg);
      throw err;
    }
  };

  const handleDeleteForMe = async (messageId) => {
    setDeleteError(null);
    try {
      await deleteForMe(messageId);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to delete message";
      setDeleteError(msg);
      throw err;
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-950 h-full">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-gray-900 relative transition-colors">
      {/* Chat Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900 z-10 shadow-xs transition-colors">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="md:hidden p-1.5 -ml-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 min-h-[40px] min-w-[40px] flex items-center justify-center"
              aria-label="Back to conversations list"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          <div className="relative">
            <Avatar name={otherParticipant?.name} size="md" />
            <span className="absolute bottom-0 right-0">
              <OnlineDot isOnline={isOnline} />
            </span>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {otherParticipant?.name || "Chat"}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-1">
              <span>{isOnline ? "Online" : "Offline"}</span>
            </p>
          </div>
        </div>
      </div>

      {deleteError && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border-b border-red-200 dark:border-red-800">
          <Alert
            type="error"
            message={deleteError}
            action={
              <button
                type="button"
                onClick={() => setDeleteError(null)}
                className="text-xs font-semibold text-red-700 dark:text-red-300 hover:underline"
              >
                Dismiss
              </button>
            }
          />
        </div>
      )}

      {/* Messages area */}
      <MessageList
        messages={messages}
        currentUserId={user?._id}
        onLoadOlder={loadOlderMessages}
        onDeleteMessage={handleDeleteMessage}
        onDeleteForMe={handleDeleteForMe}
        isFetchingOlder={isFetchingOlder}
        hasMore={hasMore}
      />

      {/* Typing indicator */}
      <TypingIndicator
        otherUserName={otherParticipant?.name}
        isTyping={isOtherTyping}
      />

      {/* Message input bar */}
      <MessageInput
        onSendMessage={handleSend}
        onSendAttachment={handleSendAttachment}
        onTyping={handleInputChange}
        disabled={Boolean(error)}
      />
    </div>
  );
};

export default ChatWindow;
