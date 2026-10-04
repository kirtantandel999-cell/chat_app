import React, { useState, useRef, useEffect } from "react";
import Button from "./Button";
import { validateFile, formatFileSize } from "../utils/fileConstants";

export const MessageInput = ({
  onSendMessage,
  onSendAttachment,
  onTyping,
  disabled = false,
}) => {
  const [text, setText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Clean up object URLs when previewUrl changes or component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e) => {
    setText(e.target.value);
    if (onTyping) {
      onTyping();
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset file input value so re-selecting same file triggers onChange
    e.target.value = "";

    const validation = validateFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error);
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleRemoveFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setSelectedFile(null);
    setUploadProgress(null);
    setErrorMessage(null);
  };

  const handleSend = async () => {
    if (isUploading || disabled) return;

    // If an attachment is selected
    if (selectedFile) {
      if (!onSendAttachment) return;

      setIsUploading(true);
      setErrorMessage(null);
      setUploadProgress(0);

      try {
        await onSendAttachment(selectedFile, text.trim(), (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percent);
          }
        });

        // Clear state on success
        handleRemoveFile();
        setText("");
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
      } catch (err) {
        const errorText =
          err.response?.data?.message || err.message || "Failed to upload file";
        setErrorMessage(errorText);
      } finally {
        setIsUploading(false);
        setUploadProgress(null);
      }
      return;
    }

    // Text-only message
    const trimmed = text.trim();
    if (!trimmed) return;

    onSendMessage(trimmed);
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const canSend = (Boolean(selectedFile) || Boolean(text.trim())) && !disabled && !isUploading;

  return (
    <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 transition-colors">
      {/* Error alert banner */}
      {errorMessage && (
        <div className="mb-2 p-2 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-700 dark:text-red-300 flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200 ml-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 rounded"
            aria-label="Dismiss error"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Selected file preview strip */}
      {selectedFile && (
        <div className="mb-2 p-2 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-between transition-colors">
          <div className="flex items-center space-x-3 overflow-hidden">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Upload preview"
                className="w-10 h-10 object-cover rounded border border-gray-200 dark:border-gray-700 flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400 rounded flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p
                className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate"
                title={selectedFile.name}
              >
                {selectedFile.name}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {formatFileSize(selectedFile.size)}
                {isUploading && uploadProgress !== null && (
                  <span className="ml-2 font-medium text-primary-600 dark:text-primary-400">
                    Uploading... {uploadProgress}%
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRemoveFile}
            disabled={isUploading}
            aria-label="Remove attached file"
            className="p-1 text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Upload progress bar */}
      {isUploading && uploadProgress !== null && (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-2 overflow-hidden">
          <div
            className="bg-primary-600 dark:bg-primary-500 h-1.5 rounded-full transition-all duration-200"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {/* Input controls bar */}
      <div className="flex items-end space-x-2">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,text/plain,text/csv,application/zip"
        />

        {/* Paperclip attach button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          aria-label="Attach file"
          className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
            />
          </svg>
        </button>

        {/* Text / caption input */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled || isUploading}
          placeholder={
            selectedFile
              ? "Add a caption... (optional)"
              : "Type a message... (Press Enter to send, Shift+Enter for new line)"
          }
          className="flex-1 max-h-32 min-h-[42px] py-2.5 px-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 transition-colors"
        />

        {/* Send button */}
        <Button
          variant="primary"
          onClick={handleSend}
          disabled={!canSend}
          aria-label="Send message"
          className="px-4"
        >
          {isUploading ? "Sending..." : "Send"}
        </Button>
      </div>
    </div>
  );
};

export default MessageInput;
