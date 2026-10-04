import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { getGridFSBucket } from "../config/gridfs.js";
import asyncHandler from "../utils/asyncHandler.js";

// @desc    Download or view an attachment file
// @route   GET /api/files/:fileId
// @access  Protected (Participants only)
export const getFile = asyncHandler(async (req, res) => {
  const { fileId } = req.params;

  // 1. Validate fileId format
  if (!mongoose.Types.ObjectId.isValid(fileId)) {
    return res.status(404).json({
      success: false,
      message: "File not found",
    });
  }

  // 2. Find message containing this fileId
  const message = await Message.findOne({
    "attachment.fileId": new mongoose.Types.ObjectId(fileId),
  });

  if (!message || !message.attachment) {
    return res.status(404).json({
      success: false,
      message: "File not found",
    });
  }

  // 3. Find conversation and verify participant
  const conversation = await Conversation.findById(message.conversation);
  if (!conversation) {
    return res.status(404).json({
      success: false,
      message: "File not found",
    });
  }

  const isParticipant = conversation.participants.some(
    (p) => p.toString() === req.user._id.toString()
  );
  if (!isParticipant) {
    // Return 404 to avoid leaking existence
    return res.status(404).json({
      success: false,
      message: "File not found",
    });
  }

  // 4. Return 404 if the requesting user deleted this message for themselves
  const isDeletedForUser = message.deletedFor?.some(
    (u) => u.toString() === req.user._id.toString()
  );
  if (isDeletedForUser) {
    return res.status(404).json({
      success: false,
      message: "File not found",
    });
  }

  // 4. Locate file in GridFS
  const bucket = getGridFSBucket();
  const files = await bucket
    .find({ _id: new mongoose.Types.ObjectId(fileId) })
    .toArray();

  if (!files || files.length === 0) {
    return res.status(404).json({
      success: false,
      message: "File not found",
    });
  }

  const fileDoc = files[0];
  const { mimeType, filename, kind } = message.attachment;

  // 5. Set headers
  res.setHeader("Content-Type", mimeType || fileDoc.contentType || "application/octet-stream");
  res.setHeader("Content-Length", fileDoc.length);
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (kind === "image") {
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
  } else {
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  }

  // 6. Pipe stream
  const downloadStream = bucket.openDownloadStream(
    new mongoose.Types.ObjectId(fileId)
  );

  downloadStream.on("error", () => {
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Failed to download file",
      });
    }
  });

  downloadStream.pipe(res);
});

export default { getFile };
