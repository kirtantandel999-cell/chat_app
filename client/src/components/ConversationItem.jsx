import React from "react";
import Avatar from "./Avatar";
import OnlineDot from "./OnlineDot";
import { formatConversationTime } from "../utils/time";

export const ConversationItem = ({
  conversation,
  currentUserId,
  isActive = false,
  isOnline = false,
  onClick,
}) => {
  const otherParticipant =
    conversation.participants?.find((p) => p._id !== currentUserId) || {
      name: "Unknown",
    };

  let lastMessageText = "No messages yet";
  if (conversation.lastMessage) {
    if (conversation.lastMessage.deletedAt) {
      lastMessageText = "This message was deleted";
    } else if (conversation.lastMessage.text) {
      lastMessageText = conversation.lastMessage.text;
    } else if (conversation.lastMessage.attachment) {
      if (conversation.lastMessage.attachment.kind === "image") {
        lastMessageText = "Photo";
      } else {
        lastMessageText = `File: ${conversation.lastMessage.attachment.filename}`;
      }
    }
  }

  const timeString = formatConversationTime(
    conversation.lastMessage?.createdAt || conversation.updatedAt
  );

  const unreadCount = conversation.unreadCount || 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg flex items-center space-x-3 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
        isActive
          ? "bg-primary-50 dark:bg-gray-800 border border-primary-200 dark:border-gray-700"
          : "hover:bg-gray-100 dark:hover:bg-gray-800/60 bg-white dark:bg-gray-900 border border-transparent"
      }`}
    >
      {/* Avatar with presence dot */}
      <div className="relative">
        <Avatar name={otherParticipant.name} size="md" />
        <span className="absolute bottom-0 right-0">
          <OnlineDot isOnline={isOnline} />
        </span>
      </div>

      {/* Conversation metadata */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4
            className={`text-sm font-semibold truncate ${
              isActive
                ? "text-primary-900 dark:text-white"
                : "text-gray-900 dark:text-gray-100"
            }`}
          >
            {otherParticipant.name}
          </h4>
          <span
            className={`text-xs whitespace-nowrap ml-2 ${
              isActive
                ? "text-primary-700 dark:text-gray-400"
                : "text-gray-400 dark:text-gray-400"
            }`}
          >
            {timeString}
          </span>
        </div>

        <div className="flex items-center justify-between mt-1">
          <p
            className={`text-xs truncate max-w-[180px] ${
              isActive
                ? "text-primary-800 dark:text-gray-300"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {lastMessageText}
          </p>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-primary-600 rounded-full">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

export default ConversationItem;
