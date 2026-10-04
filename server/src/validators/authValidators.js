import { z } from "zod";

const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)/;

export const registerSchema = z
  .object({
    name: z
      .string({ required_error: "Name is required" })
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name cannot exceed 50 characters"),
    email: z
      .string({ required_error: "Email is required" })
      .trim()
      .toLowerCase()
      .email("Please provide a valid email address"),
    password: z
      .string({ required_error: "Password is required" })
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password cannot exceed 72 characters")
      .regex(passwordRegex, "Password must contain at least one letter and one number"),
  })
  .strip();

export const loginSchema = z
  .object({
    email: z
      .string({ required_error: "Email is required" })
      .trim()
      .toLowerCase()
      .email("Please provide a valid email address"),
    password: z
      .string({ required_error: "Password is required" })
      .min(1, "Password is required"),
  })
  .strip();

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({ required_error: "Current password is required" })
      .min(1, "Current password is required"),
    newPassword: z
      .string({ required_error: "New password is required" })
      .min(8, "New password must be at least 8 characters")
      .max(72, "New password cannot exceed 72 characters")
      .regex(passwordRegex, "New password must contain at least one letter and one number"),
  })
  .strip()
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "New password must differ from current password",
    path: ["newPassword"],
  });
