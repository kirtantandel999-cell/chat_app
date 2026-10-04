import React from "react";
import { formatMessageTime } from "../utils/time";
import { formatFileSize } from "../utils/fileConstants";
import useFileUrl from "../hooks/useFileUrl";
import ConfirmModal from "./ConfirmModal";

const AttachmentView = ({ attachment, isOwn }) => {
  const { url, loading, error } = useFileUrl(attachment.fileId);

  if (attachment.kind === "image") {
    if (loading) {
      return (
        <div
          className="w-48 h-36 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center text-xs text-gray-400 dark:text-gray-400 mb-2 animate-pulse"
          role="status"
        >
          Loading image...
        </div>
      );
    }

    if (error) {
      return (
        <div className="w-48 p-2 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 rounded text-xs mb-2 border border-red-200 dark:border-red-800">
          Failed to load image
        </div>
      );
    }

    if (url) {
      return (
        <div className="mb-2">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open image in new tab"
            className="block rounded overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <img
              src={url}
              alt={attachment.filename || "Uploaded photo"}
              className="max-w-xs max-h-60 rounded object-cover cursor-pointer hover:opacity-95 transition-opacity"
            />
          </a>
        </div>
      );
    }

    return null;
  }

  // Generic file
  return (
    <div
      className={`flex items-center space-x-3 p-2.5 rounded-lg mb-2 transition-colors ${
        isOwn
          ? "bg-primary-700/60"
          : "bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700"
      }`}
    >
      <div className="flex-shrink-0">
        <svg
          className={`w-6 h-6 ${
            isOwn ? "text-primary-200" : "text-gray-500 dark:text-gray-400"
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <div className="flex-1 min-w-0 pr-2">
        <p
          className={`text-xs font-medium truncate ${
            isOwn ? "text-white" : "text-gray-900 dark:text-gray-100"
          }`}
          title={attachment.filename}
        >
          {attachment.filename}
        </p>
        <p
          className={`text-[10px] ${
            isOwn ? "text-primary-200" : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {formatFileSize(attachment.size)}
        </p>
      </div>
      <div className="flex-shrink-0">
        {loading ? (
          <span
            className={`text-xs ${
              isOwn ? "text-primary-200" : "text-gray-400 dark:text-gray-400"
            }`}
          >
            Loading...
          </span>
        ) : error ? (
          <span className="text-xs text-red-400">Error</span>
        ) : (
          <a
            href={url}
            download={attachment.filename}
            aria-label={`Download ${attachment.filename}`}
            className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
              isOwn
                ? "bg-white text-primary-800 hover:bg-primary-50"
                : "bg-primary-600 text-white hover:bg-primary-700"
            }`}
          >
            Download
          </a>
        )}
      </div>
    </div>
  );
};

export const MessageBubble = ({
  message,
  isOwn = false,
  onDeleteMessage,
  onDeleteForMe,
}) => {
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [showMenu, setShowMenu] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const menuRef = React.useRef(null);
  const isDeleted = Boolean(message.deletedAt);

  // Close menu on Escape or click outside
  React.useEffect(() => {
    if (!showMenu) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowMenu(false);
      }
    };

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  const handleDeleteForEveryone = async () => {
    if (!onDeleteMessage) return;
    setIsDeleting(true);
    try {
      await onDeleteMessage(message._id);
      setShowConfirm(false);
    } catch (err) {
      console.error("Failed to delete message for everyone:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteForMe = async () => {
    setShowMenu(false);
    if (!onDeleteForMe) return;
    try {
      await onDeleteForMe(message._id);
    } catch (err) {
      console.error("Failed to delete message for me:", err);
    }
  };

  // Render options menu button & dropdown
  const renderOptionsMenu = () => (
    <div
      ref={menuRef}
      className={`relative flex items-center mb-1 transition-opacity ${
        showMenu
          ? "opacity-100"
          : "opacity-0 group-hover:opacity-100 focus-within:opacity-100"
      }`}
    >
      <button
        type="button"
        onClick={() => setShowMenu((prev) => !prev)}
        aria-label="Message options"
        aria-haspopup="true"
        aria-expanded={showMenu}
        title="Message options"
        className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
          />
        </svg>
      </button>

      {showMenu && (
        <div
          role="menu"
          className={`absolute bottom-full mb-1 z-30 min-w-[170px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg py-1 ${
            isOwn ? "right-0" : "left-0"
          }`}
        >
          <button
            type="button"
            role="menuitem"
            onClick={handleDeleteForMe}
            className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center space-x-2 transition-colors focus-visible:outline-none focus-visible:bg-gray-100 dark:focus-visible:bg-gray-800"
          >
            <svg
              className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            <span>Delete for me</span>
          </button>

          {/* "Delete for everyone" is only available on own, non-deleted messages */}
          {isOwn && !isDeleted && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setShowMenu(false);
                setShowConfirm(true);
              }}
              className="w-full text-left px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center space-x-2 transition-colors focus-visible:outline-none focus-visible:bg-red-50 dark:focus-visible:bg-red-950/40"
            >
              <svg
                className="w-3.5 h-3.5 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                />
              </svg>
              <span>Delete for everyone</span>
            </button>
          )}
        </div>
      )}
    </div>
  );

  // If message was deleted
  if (isDeleted) {
    return (
      <div
        className={`group flex w-full mb-3 items-end ${
          isOwn ? "justify-end space-x-1" : "justify-start space-x-1"
        }`}
      >
        {!isOwn && renderOptionsMenu()}

        <div
          className={`max-w-[75%] px-4 py-2.5 rounded-lg text-sm italic transition-colors ${
            isOwn
              ? "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-br-none"
              : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-bl-none"
          }`}
        >
          <div className="flex items-center space-x-1.5">
            <svg
              className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
            <span>This message was deleted</span>
          </div>
          <div className="text-[10px] mt-1 text-right text-gray-400 dark:text-gray-500 select-none not-italic">
            {formatMessageTime(message.createdAt)}
          </div>
        </div>

        {isOwn && renderOptionsMenu()}
      </div>
    );
  }

  return (
    <>
      <div
        className={`group flex w-full mb-3 items-end ${
          isOwn ? "justify-end space-x-1" : "justify-start space-x-1"
        }`}
      >
        {!isOwn && renderOptionsMenu()}

        <div
          className={`max-w-[75%] px-4 py-2.5 rounded-lg text-sm break-words relative transition-colors ${
            isOwn
              ? "bg-primary-600 text-white rounded-br-none"
              : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 shadow-sm rounded-bl-none"
          }`}
        >
          {message.attachment && (
            <AttachmentView attachment={message.attachment} isOwn={isOwn} />
          )}
          {message.text && (
            <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
          )}
          <div
            className={`text-[10px] mt-1 text-right select-none ${
              isOwn ? "text-primary-100" : "text-gray-400 dark:text-gray-400"
            }`}
          >
            {formatMessageTime(message.createdAt)}
          </div>
        </div>

        {isOwn && renderOptionsMenu()}
      </div>

      {showConfirm && (
        <ConfirmModal
          isOpen={showConfirm}
          title="Delete message"
          message="Delete this message for everyone?"
          confirmLabel="Delete for everyone"
          confirmVariant="danger"
          isLoading={isDeleting}
          onConfirm={handleDeleteForEveryone}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
};

export default MessageBubble;
