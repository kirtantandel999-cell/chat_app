import { Router } from "express";
import { getFile } from "../controllers/fileController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect);

router.get("/:fileId", getFile);

export default router;
