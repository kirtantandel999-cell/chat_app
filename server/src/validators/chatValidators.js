import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const sendMessageSchema = z
  .object({
    conversationId: z
      .string({ required_error: "Conversation ID is required" })
      .regex(objectIdRegex, "Invalid conversation ID format"),
    text: z
      .string({ required_error: "Message text is required" })
      .trim()
      .min(1, "Message cannot be empty")
      .max(2000, "Message cannot exceed 2000 characters"),
  })
  .strip();

export const createConversationSchema = z
  .object({
    userId: z
      .string({ required_error: "User ID is required" })
      .regex(objectIdRegex, "Invalid user ID format"),
  })
  .strip();

export const messagesQuerySchema = z
  .object({
    before: z
      .string()
      .regex(objectIdRegex, "Invalid message ID format for cursor")
      .optional(),
    limit: z
      .coerce
      .number()
      .int()
      .min(1, "Limit must be at least 1")
      .max(50, "Limit cannot exceed 50")
      .default(30),
  })
  .strip();

export const usersQuerySchema = z
  .object({
    search: z
      .string()
      .trim()
      .max(100, "Search query cannot exceed 100 characters")
      .optional()
      .default(""),
  })
  .strip();

export const conversationIdParamSchema = z
  .object({
    id: z
      .string({ required_error: "Conversation ID parameter is required" })
      .regex(objectIdRegex, "Invalid conversation ID format"),
  })
  .strip();
