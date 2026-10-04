import multer from "multer";
import config from "../config/env.js";

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: config.maxFileSizeMb * 1024 * 1024, // 10 MB
    files: 1,
  },
});

export const uploadSingleFile = (req, res, next) => {
  const uploadHandler = upload.single("file");

  uploadHandler(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
          success: false,
          message: `File too large (max ${config.maxFileSizeMb} MB)`,
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || "File upload error",
      });
    }
    next();
  });
};

export default uploadSingleFile;
