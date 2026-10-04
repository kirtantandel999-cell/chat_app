import React, { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import Spinner from "./Spinner";

export const MessageList = ({
  messages = [],
  currentUserId,
  onLoadOlder,
  onDeleteMessage,
  onDeleteForMe,
  isFetchingOlder = false,
  hasMore = false,
}) => {
  const containerRef = useRef(null);
  const bottomRef = useRef(null);
  const prevScrollHeightRef = useRef(0);

  // Auto-scroll to bottom on initial load and when new messages arrive
  useEffect(() => {
    if (!isFetchingOlder) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, isFetchingOlder]);

  // Maintain scroll position when older messages are prepended
  useEffect(() => {
    if (containerRef.current && isFetchingOlder) {
      const newScrollHeight = containerRef.current.scrollHeight;
      const scrollDiff = newScrollHeight - prevScrollHeightRef.current;
      containerRef.current.scrollTop += scrollDiff;
    }
  }, [messages, isFetchingOlder]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight } = e.currentTarget;
    if (scrollTop <= 10 && hasMore && !isFetchingOlder) {
      prevScrollHeightRef.current = scrollHeight;
      onLoadOlder();
    }
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-4 space-y-1 bg-gray-50 dark:bg-gray-950 flex flex-col transition-colors"
    >
      {/* Loading older messages indicator */}
      {isFetchingOlder && (
        <div className="py-2 text-center">
          <Spinner size="sm" />
        </div>
      )}

      {/* Message history */}
      {messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-center p-8 text-sm text-gray-400 dark:text-gray-500">
          No messages yet. Say hello!
        </div>
      ) : (
        messages.map((msg) => (
          <MessageBubble
            key={msg._id}
            message={msg}
            isOwn={msg.sender?._id === currentUserId}
            onDeleteMessage={onDeleteMessage}
            onDeleteForMe={onDeleteForMe}
          />
        ))
      )}

      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;
