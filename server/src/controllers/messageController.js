import mongoose from "mongoose";
import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import { getGridFSBucket } from "../config/gridfs.js";
import asyncHandler from "../utils/asyncHandler.js";

// @desc    Soft-delete a message for everyone
// @route   DELETE /api/messages/:id
// @access  Protected (Sender only)
export const deleteMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // 1. Validate ID format (400 if invalid)
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid message ID",
    });
  }

  // 2. Load message
  const message = await Message.findById(id);
  if (!message) {
    return res.status(404).json({
      success: false,
      message: "Message not found",
    });
  }

  // 3. Verify conversation existence and participant membership
  const conversation = await Conversation.findById(message.conversation);
  if (!conversation) {
    return res.status(404).json({
      success: false,
      message: "Message not found",
    });
  }

  const isParticipant = conversation.participants.some(
    (p) => p.toString() === req.user._id.toString()
  );
  if (!isParticipant) {
    return res.status(404).json({
      success: false,
      message: "Message not found",
    });
  }

  // 4. Verify sender authorization (403 if not sender)
  if (message.sender.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: "You can only delete your own messages",
    });
  }

  // 5. Idempotent check
  if (message.deletedAt) {
    return res.status(200).json({
      success: true,
      data: { message },
    });
  }

  // 6. Delete GridFS attachment if present
  if (message.attachment && message.attachment.fileId) {
    try {
      const bucket = getGridFSBucket();
      await bucket.delete(new mongoose.Types.ObjectId(message.attachment.fileId));
    } catch (err) {
      console.error("Failed to delete attachment from GridFS:", err);
    }
  }

  // 7. Soft delete message document
  message.deletedAt = new Date();
  message.deletedBy = req.user._id;
  message.text = "";
  message.attachment = null;
  await message.save();

  // Populate sender info for return
  const populatedMessage = await Message.findById(message._id).populate(
    "sender",
    "_id name email"
  );

  // 8. Emit Socket.IO events to participants
  const io = req.app.get("io");
  if (io) {
    for (const p of conversation.participants) {
      const participantRoom = `user:${p.toString()}`;
      io.to(participantRoom).emit("message:deleted", {
        conversationId: conversation._id.toString(),
        messageId: message._id.toString(),
      });
      io.to(participantRoom).emit("conversation:updated", {
        conversationId: conversation._id.toString(),
        lastMessage: populatedMessage,
        updatedAt: conversation.updatedAt,
      });
    }
  }

  res.status(200).json({
    success: true,
    data: { message: populatedMessage },
  });
});

// @desc    Delete a message only for the requesting user
// @route   POST /api/messages/:id/delete-for-me
// @access  Protected (Participants only)
export const deleteForMe = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // 1. Validate ID format (400 if invalid)
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid message ID",
    });
  }

  // 2. Load message
  const message = await Message.findById(id);
  if (!message) {
    return res.status(404).json({
      success: false,
      message: "Message not found",
    });
  }

  // 3. Verify conversation existence and participant membership
  const conversation = await Conversation.findById(message.conversation);
  if (!conversation) {
    return res.status(404).json({
      success: false,
      message: "Message not found",
    });
  }

  const isParticipant = conversation.participants.some(
    (p) => p.toString() === req.user._id.toString()
  );
  if (!isParticipant) {
    return res.status(404).json({
      success: false,
      message: "Message not found",
    });
  }

  // 4. Add requesting user to deletedFor using $addToSet (idempotent)
  await Message.findByIdAndUpdate(message._id, {
    $addToSet: { deletedFor: req.user._id },
  });

  // 5. Emit message:deleted_for_me and conversation:updated to hider's user room only
  const io = req.app.get("io");
  if (io) {
    const userRoom = `user:${req.user._id.toString()}`;
    io.to(userRoom).emit("message:deleted_for_me", {
      conversationId: conversation._id.toString(),
      messageId: message._id.toString(),
    });

    // Resolve fallback preview for this user
    let previewMessage = null;
    const latestVisibleMessage = await Message.findOne({
      conversation: conversation._id,
      deletedFor: { $ne: req.user._id },
    })
      .sort({ _id: -1 })
      .populate("sender", "_id name email");

    if (latestVisibleMessage) {
      previewMessage = latestVisibleMessage;
    }

    io.to(userRoom).emit("conversation:updated", {
      conversationId: conversation._id.toString(),
      lastMessage: previewMessage,
      updatedAt: conversation.updatedAt,
    });
  }

  res.status(200).json({
    success: true,
    data: { messageId: message._id },
  });
});

export default { deleteMessage, deleteForMe };
