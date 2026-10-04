import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema } from "../src/validators/authValidators.js";
import {
  sendMessageSchema,
  createConversationSchema,
  conversationIdParamSchema,
} from "../src/validators/chatValidators.js";

describe("Direct Schema Validators", () => {
  it("should validate and strip extra fields on registerSchema", () => {
    const input = {
      name: "Valid User",
      email: "VALID@EXAMPLE.COM",
      password: "Password123",
      extraField: "ignored",
    };

    const result = registerSchema.safeParse(input);
    expect(result.success).toBe(true);
    expect(result.data.email).toBe("valid@example.com");
    expect(result.data.name).toBe("Valid User");
    expect(result.data.extraField).toBeUndefined();
  });

  it("should fail validation on missing required fields", () => {
    const input = {
      email: "valid@example.com",
    };

    const result = loginSchema.safeParse(input);
    expect(result.success).toBe(false);
    const errors = result.error.flatten().fieldErrors;
    expect(errors.password).toBeDefined();
  });

  it("should validate MongoDB ObjectId in conversationIdParamSchema", () => {
    const validId = "507f1f77bcf86cd799439011";
    const invalidId = "not-a-valid-id";

    expect(conversationIdParamSchema.safeParse({ id: validId }).success).toBe(true);
    expect(conversationIdParamSchema.safeParse({ id: invalidId }).success).toBe(false);
  });

  it("should validate sendMessageSchema with trimmed message text", () => {
    const validMsg = {
      conversationId: "507f1f77bcf86cd799439011",
      text: "  Hello world  ",
    };
    const parsed = sendMessageSchema.safeParse(validMsg);
    expect(parsed.success).toBe(true);
    expect(parsed.data.text).toBe("Hello world");

    const emptyMsg = {
      conversationId: "507f1f77bcf86cd799439011",
      text: "   ",
    };
    expect(sendMessageSchema.safeParse(emptyMsg).success).toBe(false);
  });
});
