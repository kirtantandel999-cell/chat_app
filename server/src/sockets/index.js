import { Server } from "socket.io";
import { verifyToken } from "../utils/token.js";
import User from "../models/User.js";
import config from "../config/env.js";
import { addPresence, removePresence, getOnlineUserIds } from "./presence.js";
import registerChatHandlers from "./chatHandlers.js";

export const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: config.clientUrl,
      credentials: true,
    },
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers?.authorization?.startsWith("Bearer ")
          ? socket.handshake.headers.authorization.split(" ")[1]
          : null);

      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const decoded = verifyToken(token);
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }

      // Check if password changed after token was issued
      if (user.passwordChangedAt) {
        const changedTimestamp = Math.floor(
          user.passwordChangedAt.getTime() / 1000
        );
        if (decoded.iat < changedTimestamp) {
          return next(
            new Error("Authentication error: Password recently changed, please log in again")
          );
        }
      }

      socket.data.user = user;
      next();
    } catch (err) {
      return next(new Error("Authentication error: Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user;
    const userId = user._id.toString();

    // 1. Join user's private notification room
    socket.join(`user:${userId}`);

    // 2. Track presence
    const transitionedOnline = addPresence(userId);
    if (transitionedOnline) {
      io.emit("presence:update", { userId, isOnline: true });
    }

    // 3. Send list of all currently online users to the newly connected socket
    socket.emit("presence:init", getOnlineUserIds());

    // 4. Register chat and typing handlers
    registerChatHandlers(io, socket);

    // 5. Handle disconnection
    socket.on("disconnect", () => {
      const transitionedOffline = removePresence(userId);
      if (transitionedOffline) {
        io.emit("presence:update", { userId, isOnline: false });
      }
    });
  });

  return io;
};

export default initializeSocket;
