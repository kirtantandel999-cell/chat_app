import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import ConversationList from "@/components/ConversationList";
import ChatWindow from "@/components/ChatWindow";
import ConnectionBanner from "@/components/ConnectionBanner";

export const Chat = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm overflow-hidden transition-colors">
      <ConnectionBanner />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Conversation List */}
        <div
          className={`w-full md:w-80 lg:w-96 flex-shrink-0 h-full ${
            conversationId ? "hidden md:block" : "block"
          }`}
        >
          <ConversationList activeConversationId={conversationId} />
        </div>

        {/* Right Panel: Chat Window or Desktop Empty State */}
        <div
          className={`flex-1 h-full flex flex-col ${
            conversationId ? "block" : "hidden md:flex"
          }`}
        >
          {conversationId ? (
            <ChatWindow
              conversationId={conversationId}
              onBack={() => navigate("/chat")}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50 dark:bg-gray-950 text-gray-500 dark:text-gray-400 transition-colors">
              <div className="w-16 h-16 rounded-full bg-primary-50 dark:bg-primary-950/50 flex items-center justify-center text-primary-600 dark:text-primary-400 mb-4 shadow-xs">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Your Messages
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                Select a conversation from the sidebar or click "New Chat" to start messaging.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
