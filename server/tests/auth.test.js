import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import User from "../src/models/User.js";
import { createUser, getAuthToken } from "./helpers.js";

describe("Auth Endpoints", () => {
  it("should successfully register a new user", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Alice Smith",
        email: "alice@example.com",
        password: "Password123",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe("alice@example.com");
    expect(res.body.data.user.password).toBeUndefined();
    expect(res.body.data.token).toBeDefined();
  });

  it("should return 409 if email is already registered", async () => {
    await createUser({ email: "duplicate@example.com", password: "Password123" });

    const res = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Duplicate User",
        email: "duplicate@example.com",
        password: "Password123",
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("already in use");
  });

  it("should successfully log in an existing user", async () => {
    await createUser({ email: "login@example.com", password: "Password123" });

    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "login@example.com",
        password: "Password123",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe("login@example.com");
  });

  it("should return 401 with 'Invalid email or password' on wrong password", async () => {
    await createUser({ email: "wrongpass@example.com", password: "Password123" });

    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "wrongpass@example.com",
        password: "WrongPassword456",
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Invalid email or password");
  });

  it("should return 401 when GET /api/auth/me is called without a token", async () => {
    const res = await request(app).get("/api/auth/me");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should reject a token issued before a password change", async () => {
    const user = await createUser({
      email: "pwchange@example.com",
      password: "OldPassword123",
    });

    // Token issued before password change (simulate token issued in the past)
    const oldToken = getAuthToken(user._id, {
      iat: Math.floor(Date.now() / 1000) - 30,
    });

    // Update password via PATCH /api/auth/change-password
    const changeRes = await request(app)
      .patch("/api/auth/change-password")
      .set("Authorization", `Bearer ${oldToken}`)
      .send({
        currentPassword: "OldPassword123",
        newPassword: "NewPassword123",
      });

    expect(changeRes.status).toBe(200);
    expect(changeRes.body.data.token).toBeDefined();

    // Now try accessing /api/auth/me using the old token
    const oldTokenRes = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${oldToken}`);

    expect(oldTokenRes.status).toBe(401);
    expect(oldTokenRes.body.message).toBe(
      "Password recently changed, please log in again"
    );

    // Verify the new token works
    const newTokenRes = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${changeRes.body.data.token}`);

    expect(newTokenRes.status).toBe(200);
    expect(newTokenRes.body.data.email).toBe("pwchange@example.com");
  });
});
