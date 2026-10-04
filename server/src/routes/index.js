import { Router } from "express";
import authRoutes from "./authRoutes.js";
import conversationRoutes from "./conversationRoutes.js";
import fileRoutes from "./fileRoutes.js";
import messageRoutes from "./messageRoutes.js";
import userRoutes from "./userRoutes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/conversations", conversationRoutes);
router.use("/files", fileRoutes);
router.use("/messages", messageRoutes);
router.use("/users", userRoutes);

export default router;
