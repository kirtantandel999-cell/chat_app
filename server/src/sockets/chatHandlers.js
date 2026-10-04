import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { sendMessageSchema } from "../validators/chatValidators.js";

// Rate limit helper: max 20 messages per 10 seconds per socket
const createRateLimiter = (limit = 20, windowMs = 10000) => {
  const timestamps = [];
  return () => {
    const now = Date.now();
    while (timestamps.length && timestamps[0] <= now - windowMs) {
      timestamps.shift();
    }
    if (timestamps.length >= limit) {
      return false;
    }
    timestamps.push(now);
    return true;
  };
};

export const registerChatHandlers = (io, socket) => {
  const user = socket.data.user;
  const userId = user._id.toString();
  const checkRateLimit = createRateLimiter(20, 10000);

  // Send message
  socket.on("message:send", async (data, callback = () => {}) => {
    // 1. Rate limiting
    if (!checkRateLimit()) {
      return callback({
        ok: false,
        error: "Rate limit exceeded. Please wait a few seconds before sending more messages.",
      });
    }

    // 2. Validate input
    const parsed = sendMessageSchema.safeParse(data);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message || "Invalid message data";
      return callback({ ok: false, error: firstIssue });
    }

    const { conversationId, text } = parsed.data;

    try {
      // 3. Verify conversation existence and participant membership
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        return callback({ ok: false, error: "Conversation not found" });
      }

      const isParticipant = conversation.participants.some(
        (p) => p.toString() === userId
      );
      if (!isParticipant) {
        return callback({
          ok: false,
          error: "You are not a participant in this conversation",
        });
      }

      // 4. Create and persist message
      const message = await Message.create({
        conversation: conversation._id,
        sender: user._id,
        text,
      });

      // 5. Update conversation's lastMessage reference
      conversation.lastMessage = message._id;
      await conversation.save();

      // 6. Populate sender info for client display
      const populatedMessage = await Message.findById(message._id).populate(
        "sender",
        "_id name email"
      );

      // 7. Emit message:new and conversation:updated to both participants' rooms
      for (const p of conversation.participants) {
        const participantRoom = `user:${p.toString()}`;
        io.to(participantRoom).emit("message:new", populatedMessage);
        io.to(participantRoom).emit("conversation:updated", {
          conversationId: conversation._id.toString(),
          lastMessage: populatedMessage,
          updatedAt: conversation.updatedAt,
        });
      }

      // 8. Send success acknowledgement
      callback({ ok: true, message: populatedMessage });
    } catch (err) {
      callback({ ok: false, error: "Failed to send message" });
    }
  });

  // Typing start
  socket.on("typing:start", async ({ conversationId } = {}) => {
    if (!conversationId) return;

    try {
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) return;

      const otherParticipant = conversation.participants.find(
        (p) => p.toString() !== userId
      );

      if (otherParticipant) {
        io.to(`user:${otherParticipant.toString()}`).emit("typing:update", {
          conversationId,
          userId,
          isTyping: true,
        });
      }
    } catch (err) {
      // Ignore typing errors silently
    }
  });

  // Typing stop
  socket.on("typing:stop", async ({ conversationId } = {}) => {
    if (!conversationId) return;

    try {
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) return;

      const otherParticipant = conversation.participants.find(
        (p) => p.toString() !== userId
      );

      if (otherParticipant) {
        io.to(`user:${otherParticipant.toString()}`).emit("typing:update", {
          conversationId,
          userId,
          isTyping: false,
        });
      }
    } catch (err) {
      // Ignore typing errors silently
    }
  });
};

export default registerChatHandlers;
