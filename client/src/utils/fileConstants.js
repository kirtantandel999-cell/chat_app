export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

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

export const BLOCKED_EXTENSIONS = new Set([
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

export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const num = parseFloat((bytes / Math.pow(k, i)).toFixed(1));
  return `${num} ${sizes[i]}`;
};

export const validateFile = (file) => {
  if (!file) {
    return { valid: false, error: "No file selected." };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File is too large (${formatFileSize(file.size)}). Maximum allowed size is 10 MB.`,
    };
  }

  const name = file.name || "";
  const lastDot = name.lastIndexOf(".");
  const ext = lastDot !== -1 ? name.substring(lastDot).toLowerCase() : "";

  if (BLOCKED_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      error: `File type "${ext}" is not permitted for security reasons.`,
    };
  }

  const allowedExts = ALLOWED_FILE_TYPES[file.type];
  if (!allowedExts || !allowedExts.includes(ext)) {
    return {
      valid: false,
      error: "File type not allowed. Supported formats: JPG, PNG, GIF, WebP, PDF, DOCX, XLSX, PPTX, TXT, CSV, ZIP.",
    };
  }

  return { valid: true };
};

export default {
  MAX_FILE_SIZE_BYTES,
  ALLOWED_FILE_TYPES,
  BLOCKED_EXTENSIONS,
  formatFileSize,
  validateFile,
};
