import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import { createUser, getAuthToken } from "./helpers.js";

describe("Conversations Endpoints", () => {
  let userA, tokenA;
  let userB, tokenB;
  let userC, tokenC;

  beforeEach(async () => {
    userA = await createUser({ email: "usera_conv@example.com" });
    tokenA = getAuthToken(userA._id);

    userB = await createUser({ email: "userb_conv@example.com" });
    tokenB = getAuthToken(userB._id);

    userC = await createUser({ email: "userc_conv@example.com" });
    tokenC = getAuthToken(userC._id);
  });

  it("should create a new conversation between user A and user B", async () => {
    const res = await request(app)
      .post("/api/conversations")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ userId: userB._id.toString() });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.participants).toHaveLength(2);
    expect(res.body.data.unreadCount).toBe(0);
  });

  it("should return the existing conversation and not create a duplicate", async () => {
    const res1 = await request(app)
      .post("/api/conversations")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ userId: userB._id.toString() });
    expect(res1.status).toBe(201);

    // User B calls create with User A
    const res2 = await request(app)
      .post("/api/conversations")
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ userId: userA._id.toString() });

    expect(res2.status).toBe(200);
    expect(res2.body.data._id).toBe(res1.body.data._id);
  });

  it("should return 400 when trying to start a conversation with oneself", async () => {
    const res = await request(app)
      .post("/api/conversations")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ userId: userA._id.toString() });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should not allow outsider User C to view conversation between User A and B", async () => {
    const convRes = await request(app)
      .post("/api/conversations")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ userId: userB._id.toString() });

    const convId = convRes.body.data._id;

    const res = await request(app)
      .get(`/api/conversations/${convId}/messages`)
      .set("Authorization", `Bearer ${tokenC}`);

    expect(res.status).toBe(404);
  });
});
