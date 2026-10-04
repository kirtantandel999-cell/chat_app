import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
  {
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    filename: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    mimeType: {
      type: String,
      required: true,
      trim: true,
    },
    size: {
      type: Number,
      required: true,
    },
    kind: {
      type: String,
      enum: ["image", "file"],
      required: true,
    },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: [true, "Message must belong to a conversation"],
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Message must have a sender"],
    },
    text: {
      type: String,
      trim: true,
      maxlength: [2000, "Message text cannot exceed 2000 characters"],
      default: "",
    },
    attachment: {
      type: attachmentSchema,
      default: null,
    },
    readAt: {
      type: Date,
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Validate that a non-deleted message must contain either non-empty text OR an attachment
messageSchema.pre("validate", function (next) {
  if (this.deletedAt) {
    return next();
  }

  const hasText = Boolean(this.text && this.text.trim().length > 0);
  const hasAttachment = Boolean(this.attachment && this.attachment.fileId);

  if (!hasText && !hasAttachment) {
    this.invalidate("text", "A message must contain either text or an attachment");
  }
  next();
});

// Compound index for efficient historical queries and pagination
messageSchema.index({ conversation: 1, createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
