import mongoose from "mongoose";
import { Readable } from "node:stream";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getGridFSBucket } from "../config/gridfs.js";
import {
  validateFileType,
  sanitizeFilename,
  checkUploadRateLimit,
} from "../utils/fileUtils.js";

// @desc    Get all conversations for logged in user
// @route   GET /api/conversations
// @access  Protected
export const getConversations = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const conversations = await Conversation.find({
    participants: userId,
  })
    .populate("participants", "_id name email")
    .populate("lastMessage")
    .sort({ updatedAt: -1 });

  // Compute unreadCount and user-specific lastMessage preview for each conversation
  const conversationsWithUnread = await Promise.all(
    conversations.map(async (conv) => {
      const unreadCount = await Message.countDocuments({
        conversation: conv._id,
        sender: { $ne: userId },
        readAt: null,
        deletedAt: null,
        deletedFor: { $ne: userId },
      });

      const convObj = conv.toObject();
      convObj.unreadCount = unreadCount;

      // Determine preview message for this user:
      // If conv.lastMessage is visible to the user, use it.
      // Otherwise, query the latest message not in deletedFor.
      let previewMessage = convObj.lastMessage;
      if (
        previewMessage &&
        previewMessage.deletedFor?.some((u) => u.toString() === userId.toString())
      ) {
        previewMessage = await Message.findOne({
          conversation: conv._id,
          deletedFor: { $ne: userId },
        })
          .sort({ _id: -1 })
          .populate("sender", "_id name email");
      }
      convObj.lastMessage = previewMessage || null;

      return convObj;
    })
  );

  res.status(200).json({
    success: true,
    data: conversationsWithUnread,
  });
});

// @desc    Get or create 1-to-1 conversation
// @route   POST /api/conversations
// @access  Protected
export const createOrGetConversation = asyncHandler(async (req, res) => {
  const { userId: targetUserId } = req.validated?.body || req.body;
  const currentUserId = req.user._id.toString();

  if (targetUserId === currentUserId) {
    return res.status(400).json({
      success: false,
      message: "You cannot start a conversation with yourself",
    });
  }

  // Ensure target user exists
  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    return res.status(404).json({
      success: false,
      message: "Target user not found",
    });
  }

  const participantsKey = Conversation.getParticipantsKey(
    currentUserId,
    targetUserId
  );

  // Check for existing conversation
  let conversation = await Conversation.findOne({ participantsKey })
    .populate("participants", "_id name email")
    .populate("lastMessage");

  if (conversation) {
    const unreadCount = await Message.countDocuments({
      conversation: conversation._id,
      sender: { $ne: req.user._id },
      readAt: null,
      deletedAt: null,
      deletedFor: { $ne: req.user._id },
    });
    const convObj = conversation.toObject();
    convObj.unreadCount = unreadCount;

    let previewMessage = convObj.lastMessage;
    if (
      previewMessage &&
      previewMessage.deletedFor?.some((u) => u.toString() === currentUserId)
    ) {
      previewMessage = await Message.findOne({
        conversation: conversation._id,
        deletedFor: { $ne: req.user._id },
      })
        .sort({ _id: -1 })
        .populate("sender", "_id name email");
    }
    convObj.lastMessage = previewMessage || null;

    return res.status(200).json({
      success: true,
      data: convObj,
    });
  }

  // Create new conversation
  conversation = await Conversation.create({
    participants: [req.user._id, targetUser._id],
    participantsKey,
    lastMessage: null,
  });

  const populated = await Conversation.findById(conversation._id)
    .populate("participants", "_id name email")
    .populate("lastMessage");

  const convObj = populated.toObject();
  convObj.unreadCount = 0;

  res.status(201).json({
    success: true,
    data: convObj,
  });
});

// @desc    Get messages for a conversation with cursor pagination
// @route   GET /api/conversations/:id/messages
// @access  Protected
export const getMessages = asyncHandler(async (req, res) => {
  const { id: conversationId } = req.validated?.params || req.params;
  const query = req.validated?.query || req.query;
  const limit = Math.min(parseInt(query.limit, 10) || 30, 50);
  const before = query.before;

  // Verify conversation and participation
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    return res.status(404).json({
      success: false,
      message: "Conversation not found",
    });
  }

  const isParticipant = conversation.participants.some(
    (p) => p.toString() === req.user._id.toString()
  );
  if (!isParticipant) {
    return res.status(404).json({
      success: false,
      message: "Conversation not found",
    });
  }

  const filter = {
    conversation: conversationId,
    deletedFor: { $ne: req.user._id },
  };
  if (before) {
    filter._id = { $lt: new mongoose.Types.ObjectId(before) };
  }

  // Fetch newest messages first up to limit, then reverse to chronological order
  const messages = await Message.find(filter)
    .sort({ _id: -1 })
    .limit(limit)
    .populate("sender", "_id name email");

  messages.reverse();

  res.status(200).json({
    success: true,
    data: messages,
  });
});

// @desc    Mark other user's messages as read
// @route   POST /api/conversations/:id/read
// @access  Protected
export const markRead = asyncHandler(async (req, res) => {
  const { id: conversationId } = req.validated?.params || req.params;

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    return res.status(404).json({
      success: false,
      message: "Conversation not found",
    });
  }

  const isParticipant = conversation.participants.some(
    (p) => p.toString() === req.user._id.toString()
  );
  if (!isParticipant) {
    return res.status(404).json({
      success: false,
      message: "Conversation not found",
    });
  }

  await Message.updateMany(
    {
      conversation: conversationId,
      sender: { $ne: req.user._id },
      readAt: null,
      deletedAt: null,
      deletedFor: { $ne: req.user._id },
    },
    {
      $set: { readAt: new Date() },
    }
  );

  res.status(200).json({
    success: true,
    message: "Messages marked as read",
  });
});

// @desc    Send a message (with optional attachment)
// @route   POST /api/conversations/:id/messages
// @access  Protected
export const uploadAttachmentMessage = asyncHandler(async (req, res) => {
  const conversationId = req.params.id;
  const rawText = req.body?.text;
  const text = typeof rawText === "string" ? rawText.trim() : "";

  // 1. Verify either file or text was provided
  if (!req.file && (!text || text.length === 0)) {
    return res.status(400).json({
      success: false,
      message: "Message text or file is required",
    });
  }

  // 2. Validate conversation ID
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    return res.status(404).json({
      success: false,
      message: "Conversation not found",
    });
  }

  // 3. Upload rate limit (max 10 uploads/min/user)
  if (!checkUploadRateLimit(req.user._id.toString())) {
    return res.status(429).json({
      success: false,
      message: "Upload limit reached. Try again in a minute.",
    });
  }

  // 4. Verify conversation exists and user is participant
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    return res.status(404).json({
      success: false,
      message: "Conversation not found",
    });
  }

  const isParticipant = conversation.participants.some(
    (p) => p.toString() === req.user._id.toString()
  );
  if (!isParticipant) {
    return res.status(404).json({
      success: false,
      message: "Conversation not found",
    });
  }

  let attachment = null;

  if (req.file) {
    // 5. Validate file type and extension
    const { valid, kind, message: validationMsg } = validateFileType(
      req.file.originalname,
      req.file.mimetype
    );
    if (!valid) {
      return res.status(400).json({
        success: false,
        message: validationMsg || "File type not allowed",
      });
    }

    // 6. Stream file into GridFS
    const sanitizedName = sanitizeFilename(req.file.originalname);
    const bucket = getGridFSBucket();
    const fileId = new mongoose.Types.ObjectId();

    try {
      await new Promise((resolve, reject) => {
        const uploadStream = bucket.openUploadStreamWithId(fileId, sanitizedName, {
          contentType: req.file.mimetype,
        });
        const readable = Readable.from(req.file.buffer);
        readable.pipe(uploadStream);
        uploadStream.on("finish", resolve);
        uploadStream.on("error", reject);
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to upload file to storage",
      });
    }

    attachment = {
      fileId,
      filename: sanitizedName,
      mimeType: req.file.mimetype,
      size: req.file.size,
      kind,
    };
  }

  // 7. Create message, rollback GridFS on failure
  let message;
  try {
    message = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      text,
      attachment,
    });

    conversation.lastMessage = message._id;
    await conversation.save();
  } catch (err) {
    if (attachment?.fileId) {
      const bucket = getGridFSBucket();
      await bucket.delete(attachment.fileId).catch(() => {});
    }
    throw err;
  }

  // 9. Populate sender
  const populatedMessage = await Message.findById(message._id).populate(
    "sender",
    "_id name email"
  );

  // 10. Emit Socket.IO events to participants
  const io = req.app.get("io");
  if (io) {
    for (const p of conversation.participants) {
      const participantRoom = `user:${p.toString()}`;
      io.to(participantRoom).emit("message:new", populatedMessage);
      io.to(participantRoom).emit("conversation:updated", {
        conversationId: conversation._id.toString(),
        lastMessage: populatedMessage,
        updatedAt: conversation.updatedAt,
      });
    }
  }

  res.status(201).json({
    success: true,
    data: populatedMessage,
  });
});
