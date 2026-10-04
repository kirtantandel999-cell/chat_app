import { Router } from "express";
import mongoose from "mongoose";
import authRoutes from "./authRoutes.js";
import conversationRoutes from "./conversationRoutes.js";
import fileRoutes from "./fileRoutes.js";
import messageRoutes from "./messageRoutes.js";
import userRoutes from "./userRoutes.js";
import connectDB from "../config/db.js";

const router = Router();

router.get("/test-db", async (req, res) => {
  try {
    await connectDB();
    const state = mongoose.connection.readyState;
    res.json({
      status: "connected",
      readyState: state,
      host: mongoose.connection.host,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      error: err.message,
      name: err.name,
      code: err.code,
    });
  }
});

router.use("/auth", authRoutes);
router.use("/conversations", conversationRoutes);
router.use("/files", fileRoutes);
router.use("/messages", messageRoutes);
router.use("/users", userRoutes);

export default router;
