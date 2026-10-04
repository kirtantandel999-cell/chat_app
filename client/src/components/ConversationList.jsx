import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useChat } from "@/context/ChatContext";
import useAuth from "@/hooks/useAuth";
import ConversationItem from "./ConversationItem";
import UserSearchModal from "./UserSearchModal";
import Button from "./Button";
import Spinner from "./Spinner";

export const ConversationList = ({ activeConversationId }) => {
  const navigate = useNavigate();
  const { conversations, isLoadingConversations, isUserOnline } = useChat();
  const { user } = useAuth();

  const [filterText, setFilterText] = useState("");
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const filteredConversations = conversations.filter((c) => {
    if (!filterText.trim()) return true;
    const otherParticipant = c.participants?.find((p) => p._id !== user?._id);
    return otherParticipant?.name
      ?.toLowerCase()
      .includes(filterText.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-colors">
      {/* Top Header & New Chat Button */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Chats</h2>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsSearchModalOpen(true)}
          className="flex items-center space-x-1"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Chat
        </Button>
      </div>

      {/* Filter conversations search */}
      <div className="p-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
        <input
          type="text"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          placeholder="Filter conversations..."
          className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 transition-colors"
        />
      </div>

      {/* Conversations scroll area */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoadingConversations ? (
          <div className="py-8">
            <Spinner size="sm" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-12 px-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filterText.trim()
                ? "No chats match your filter"
                : "No conversations yet. Start a chat!"}
            </p>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const otherParticipant = conv.participants?.find(
              (p) => p._id !== user?._id
            );
            const online = isUserOnline(otherParticipant?._id);

            return (
              <ConversationItem
                key={conv._id}
                conversation={conv}
                currentUserId={user?._id}
                isActive={conv._id === activeConversationId}
                isOnline={online}
                onClick={() => navigate(`/chat/${conv._id}`)}
              />
            );
          })
        )}
      </div>

      {/* Search & Start Chat Modal */}
      <UserSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />
    </div>
  );
};

export default ConversationList;
