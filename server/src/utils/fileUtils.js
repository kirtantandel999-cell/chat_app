import path from "node:path";

// Allowed MIME types and their permitted file extensions
export const ALLOWED_FILE_TYPES = {
  // Images
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/gif": [".gif"],
  "image/webp": [".webp"],

  // Documents
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/vnd.ms-powerpoint": [".ppt"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
  "text/plain": [".txt"],
  "text/csv": [".csv"],
  "application/zip": [".zip"],
  "application/x-zip-compressed": [".zip"],
};

export const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

// Explicitly blocked dangerous extensions
const BLOCKED_EXTENSIONS = new Set([
  ".svg",
  ".html",
  ".htm",
  ".js",
  ".mjs",
  ".exe",
  ".bat",
  ".sh",
  ".cmd",
  ".php",
]);

export const validateFileType = (originalName, mimeType) => {
  if (!originalName || !mimeType) {
    return { valid: false, message: "Missing file name or MIME type" };
  }

  const ext = path.extname(originalName).toLowerCase();

  // Reject blocked extensions
  if (BLOCKED_EXTENSIONS.has(ext)) {
    return { valid: false, message: "File type not allowed" };
  }

  // Check MIME type in allowlist
  const allowedExts = ALLOWED_FILE_TYPES[mimeType];
  if (!allowedExts || !allowedExts.includes(ext)) {
    return { valid: false, message: "File type not allowed" };
  }

  const kind = IMAGE_MIME_TYPES.has(mimeType) ? "image" : "file";
  return { valid: true, kind };
};

export const sanitizeFilename = (filename) => {
  if (!filename) return "file";

  // Get basename (strip directory paths)
  const base = path.basename(filename);

  // Remove control characters and non-printable characters
  let clean = base.replace(/[\x00-\x1F\x7F<>:"/\\|?*]/g, "_");

  // Trim whitespace
  clean = clean.trim();

  // Limit to 100 characters while preserving extension if possible
  if (clean.length > 100) {
    const ext = path.extname(clean);
    const nameWithoutExt = path.basename(clean, ext);
    clean = nameWithoutExt.substring(0, 100 - ext.length) + ext;
  }

  return clean || "file";
};

// In-memory sliding window rate limiter: max 10 uploads per minute per user
const userUploadWindows = new Map();

export const checkUploadRateLimit = (userId, limit = 10, windowMs = 60000) => {
  const now = Date.now();
  let timestamps = userUploadWindows.get(userId) || [];

  // Filter timestamps within window
  timestamps = timestamps.filter((t) => t > now - windowMs);

  if (timestamps.length >= limit) {
    userUploadWindows.set(userId, timestamps);
    return false; // Rate limit exceeded
  }

  timestamps.push(now);
  userUploadWindows.set(userId, timestamps);
  return true;
};

export const clearUploadRateLimits = () => {
  userUploadWindows.clear();
};

export default {
  ALLOWED_FILE_TYPES,
  IMAGE_MIME_TYPES,
  validateFileType,
  sanitizeFilename,
  checkUploadRateLimit,
  clearUploadRateLimits,
};
