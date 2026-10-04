import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import config from "./config/env.js";
import errorHandler from "./middleware/errorHandler.js";

import apiRoutes from "./routes/index.js";
import connectDB from "./config/db.js";

const app = express();

// Security headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  })
);

// Logging
if (config.nodeEnv === "development") {
  app.use(morgan("dev"));
}

// Body parser
app.use(express.json());

// Database connection middleware for serverless requests
app.use("/api", async (req, res, next) => {
  if (req.path === "/health") return next();
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// API Routes
app.use("/api", apiRoutes);

// 404 Handler for unknown routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler
app.use(errorHandler);

export default app;
