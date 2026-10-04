import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    participantsKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Helper to generate canonical sorted key for any two participants
conversationSchema.statics.getParticipantsKey = function (userId1, userId2) {
  return [userId1.toString(), userId2.toString()].sort().join("_");
};

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
