import http from "node:http";
import app from "./app.js";
import connectDB from "./config/db.js";
import config from "./config/env.js";
import { initializeSocket } from "./sockets/index.js";

const startServer = async () => {
  await connectDB();

  // Create Node HTTP server wrapping Express app
  const server = http.createServer(app);

  // Initialize Socket.IO with CORS matching CLIENT_URL
  const io = initializeSocket(server);
  app.set("io", io);

  server.listen(config.port, () => {
    console.log(
      `Chat Server running in ${config.nodeEnv} mode on port ${config.port}`
    );
  });

  process.on("unhandledRejection", (err) => {
    console.error(`Unhandled Rejection: ${err.message}`);
    server.close(() => process.exit(1));
  });

  process.on("SIGINT", () => {
    server.close(() => process.exit(0));
  });

  process.on("SIGTERM", () => {
    server.close(() => process.exit(0));
  });
};

if (process.env.NODE_ENV !== "test" && !process.env.VERCEL) {
  startServer();
}

export default app;
