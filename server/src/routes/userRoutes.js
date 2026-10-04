import { Router } from "express";
import {
  getUsers,
  getMe,
  updateMe,
  deleteMe,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { updateMeSchema } from "../validators/userValidators.js";
import { usersQuerySchema } from "../validators/chatValidators.js";

const router = Router();

router.use(protect);

router.get("/", validate(usersQuerySchema, "query"), getUsers);
router.get("/me", getMe);
router.patch("/me", validate(updateMeSchema, "body"), updateMe);
router.delete("/me", deleteMe);

export default router;
