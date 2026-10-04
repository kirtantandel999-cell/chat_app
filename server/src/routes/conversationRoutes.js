import { Router } from "express";
import {
  getConversations,
  createOrGetConversation,
  getMessages,
  markRead,
  uploadAttachmentMessage,
} from "../controllers/conversationController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { uploadSingleFile } from "../middleware/uploadMiddleware.js";
import {
  createConversationSchema,
  messagesQuerySchema,
  conversationIdParamSchema,
} from "../validators/chatValidators.js";

const router = Router();

router.use(protect);

router
  .route("/")
  .get(getConversations)
  .post(validate(createConversationSchema, "body"), createOrGetConversation);

router
  .route("/:id/messages")
  .get(
    validate(conversationIdParamSchema, "params"),
    validate(messagesQuerySchema, "query"),
    getMessages
  )
  .post(
    validate(conversationIdParamSchema, "params"),
    uploadSingleFile,
    uploadAttachmentMessage
  );

router.post(
  "/:id/read",
  validate(conversationIdParamSchema, "params"),
  markRead
);

export default router;
