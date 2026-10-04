import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import chatApi from "@/api/chatApi";
import { useChat } from "@/context/ChatContext";
import useDebounce from "@/hooks/useDebounce";
import Avatar from "./Avatar";
import OnlineDot from "./OnlineDot";
import Alert from "./Alert";
import Spinner from "./Spinner";

export const UserSearchModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { conversations, addConversation, isUserOnline } = useChat();

  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionUserId, setActionUserId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const debouncedSearch = useDebounce(search, 300);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSearch("");
      setResults([]);
      setErrorMessage("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    let isIgnored = false;
    setIsLoading(true);
    setErrorMessage("");

    chatApi
      .getUsers(debouncedSearch)
      .then((users) => {
        if (!isIgnored) {
          setResults(users);
        }
      })
      .catch((err) => {
        if (!isIgnored) {
          setErrorMessage(err.message || "Failed to search users");
        }
      })
      .finally(() => {
        if (!isIgnored) {
          setIsLoading(false);
        }
      });

    return () => {
      isIgnored = true;
    };
  }, [debouncedSearch, isOpen]);

  // Set of user IDs that already have a conversation in ChatContext
  const existingUserIds = new Set(
    conversations.flatMap((c) =>
      c.participants?.map((p) => p._id) || []
    )
  );

  const handleSelectUser = async (userId) => {
    setActionUserId(userId);
    setErrorMessage("");

    try {
      const conv = await chatApi.createConversation(userId);
      addConversation(conv);
      onClose();
      setSearch("");
      navigate(`/chat/${conv._id}`);
    } catch (err) {
      setErrorMessage(err.message || "Failed to start conversation");
    } finally {
      setActionUserId(null);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !actionUserId) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, actionUserId, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 transition-colors"
      onClick={(e) => {
        if (e.target === e.currentTarget && !actionUserId) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-search-title"
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 max-w-md w-full overflow-hidden flex flex-col max-h-[85vh] transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h3 id="user-search-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Start a new conversation
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={Boolean(actionUserId)}
            aria-label="Close dialog"
            className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 p-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search people by name or email..."
            className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 transition-colors"
          />
        </div>

        {errorMessage && (
          <div className="p-4">
            <Alert type="error" message={errorMessage} />
          </div>
        )}

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-gray-100 dark:divide-gray-800">
          {isLoading ? (
            <div className="py-8">
              <Spinner size="sm" />
            </div>
          ) : results.length === 0 ? (
            <p className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
              {search.trim() ? "No users found" : "Type to find people to chat with"}
            </p>
          ) : (
            results.map((targetUser) => {
              const isChatting = existingUserIds.has(targetUser._id);
              const isCurrentAction = actionUserId === targetUser._id;
              const online = isUserOnline(targetUser._id);

              return (
                <button
                  key={targetUser._id}
                  type="button"
                  disabled={Boolean(actionUserId)}
                  onClick={() => handleSelectUser(targetUser._id)}
                  className="w-full text-left p-3 rounded-lg flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar name={targetUser.name} size="sm" />
                      <span className="absolute bottom-0 right-0">
                        <OnlineDot isOnline={online} />
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {targetUser.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{targetUser.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {isChatting && (
                      <span className="text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/50 px-2 py-0.5 rounded-full">
                        Chatting
                      </span>
                    )}
                    {isCurrentAction && (
                      <span className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default UserSearchModal;
