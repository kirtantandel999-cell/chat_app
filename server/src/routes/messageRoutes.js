import { Router } from "express";
import { deleteMessage, deleteForMe } from "../controllers/messageController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect);

router.delete("/:id", deleteMessage);
router.post("/:id/delete-for-me", deleteForMe);

export default router;
