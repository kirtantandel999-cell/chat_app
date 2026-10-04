import { Router } from "express";
import {
  register,
  login,
  getCurrentUser,
  changePassword,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
} from "../validators/authValidators.js";

const router = Router();

router.post("/register", validate(registerSchema, "body"), register);
router.post("/login", validate(loginSchema, "body"), login);
router.get("/me", protect, getCurrentUser);
router.patch(
  "/change-password",
  protect,
  validate(changePasswordSchema, "body"),
  changePassword
);

export default router;
