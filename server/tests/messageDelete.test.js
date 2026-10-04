import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app.js";
import Conversation from "../src/models/Conversation.js";
import Message from "../src/models/Message.js";
import { createUser, getAuthToken } from "./helpers.js";

describe("Message Deletion (DELETE /api/messages/:id)", () => {
  let userA, tokenA;
  let userB, tokenB;
  let userC, tokenC;
  let conversation;

  beforeEach(async () => {
    userA = await createUser({ email: "user_a_del@example.com" });
    tokenA = getAuthToken(userA._id);

    userB = await createUser({ email: "user_b_del@example.com" });
    tokenB = getAuthToken(userB._id);

    userC = await createUser({ email: "user_c_del@example.com" });
    tokenC = getAuthToken(userC._id);

    conversation = await Conversation.create({
      participants: [userA._id, userB._id],
      participantsKey: Conversation.getParticipantsKey(userA._id, userB._id),
    });
  });

  it("should allow sender to delete own message and return 200 with soft-deleted fields", async () => {
    const msg = await Message.create({
      conversation: conversation._id,
      sender: userA._id,
      text: "Secret message",
    });

    const res = await request(app)
      .delete(`/api/messages/${msg._id}`)
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message.text).toBe("");
    expect(res.body.data.message.deletedAt).toBeDefined();
    expect(res.body.data.message.deletedBy.toString()).toBe(userA._id.toString());

    // Verify in database
    const inDb = await Message.findById(msg._id);
    expect(inDb.text).toBe("");
    expect(inDb.deletedAt).not.toBeNull();
  });

  it("should return 403 when another participant attempts to delete someone else's message", async () => {
    const msg = await Message.create({
      conversation: conversation._id,
      sender: userA._id,
      text: "User A says hello",
    });

    const res = await request(app)
      .delete(`/api/messages/${msg._id}`)
      .set("Authorization", `Bearer ${tokenB}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/only delete your own messages/i);
  });

  it("should return 404 when an outsider user attempts to delete a message", async () => {
    const msg = await Message.create({
      conversation: conversation._id,
      sender: userA._id,
      text: "Confidential",
    });

    const res = await request(app)
      .delete(`/api/messages/${msg._id}`)
      .set("Authorization", `Bearer ${tokenC}`);

    expect(res.status).toBe(404);
  });

  it("should return 400 when invalid ObjectId is passed", async () => {
    const res = await request(app)
      .delete("/api/messages/invalid-id-123")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid message id/i);
  });

  it("should be idempotent and return 200 if deleted twice", async () => {
    const msg = await Message.create({
      conversation: conversation._id,
      sender: userA._id,
      text: "Once deleted",
    });

    const res1 = await request(app)
      .delete(`/api/messages/${msg._id}`)
      .set("Authorization", `Bearer ${tokenA}`);
    expect(res1.status).toBe(200);

    const res2 = await request(app)
      .delete(`/api/messages/${msg._id}`)
      .set("Authorization", `Bearer ${tokenA}`);
    expect(res2.status).toBe(200);
    expect(res2.body.data.message.deletedAt).toBeDefined();
  });

  it("should delete attachment from GridFS and return 404 on GET /api/files/:fileId", async () => {
    const fakeBuffer = Buffer.from("image data");
    const uploadRes = await request(app)
      .post(`/api/conversations/${conversation._id}/messages`)
      .set("Authorization", `Bearer ${tokenA}`)
      .attach("file", fakeBuffer, "test_pic.jpg");

    expect(uploadRes.status).toBe(201);
    const msgId = uploadRes.body.data._id;
    const fileId = uploadRes.body.data.attachment.fileId;

    // Verify file is downloadable initially
    const preRes = await request(app)
      .get(`/api/files/${fileId}`)
      .set("Authorization", `Bearer ${tokenB}`);
    expect(preRes.status).toBe(200);

    // Delete message
    const delRes = await request(app)
      .delete(`/api/messages/${msgId}`)
      .set("Authorization", `Bearer ${tokenA}`);
    expect(delRes.status).toBe(200);

    // Verify file returns 404 after deletion
    const postRes = await request(app)
      .get(`/api/files/${fileId}`)
      .set("Authorization", `Bearer ${tokenB}`);
    expect(postRes.status).toBe(404);
  });

  it("should ignore deleted messages in unread counts", async () => {
    // User A sends 2 messages to User B
    const msg1 = await Message.create({
      conversation: conversation._id,
      sender: userA._id,
      text: "Msg 1",
    });
    const msg2 = await Message.create({
      conversation: conversation._id,
      sender: userA._id,
      text: "Msg 2",
    });

    // User B's unread count should be 2
    let convsRes = await request(app)
      .get("/api/conversations")
      .set("Authorization", `Bearer ${tokenB}`);
    expect(convsRes.body.data[0].unreadCount).toBe(2);

    // User A deletes msg1
    await request(app)
      .delete(`/api/messages/${msg1._id}`)
      .set("Authorization", `Bearer ${tokenA}`);

    // User B's unread count should now be 1
    convsRes = await request(app)
      .get("/api/conversations")
      .set("Authorization", `Bearer ${tokenB}`);
    expect(convsRes.body.data[0].unreadCount).toBe(1);
  });

  describe("Message Delete For Me (POST /api/messages/:id/delete-for-me)", () => {
    it("should allow sender to delete message for themselves; recipient still sees it", async () => {
      const msg = await Message.create({
        conversation: conversation._id,
        sender: userA._id,
        text: "Delete for me test",
      });

      const res = await request(app)
        .post(`/api/messages/${msg._id}/delete-for-me`)
        .set("Authorization", `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // User A (sender) calls getMessages - msg should be hidden
      const msgsA = await request(app)
        .get(`/api/conversations/${conversation._id}/messages`)
        .set("Authorization", `Bearer ${tokenA}`);
      expect(msgsA.body.data.some((m) => m._id === msg._id.toString())).toBe(false);

      // User B (recipient) calls getMessages - msg should still be visible
      const msgsB = await request(app)
        .get(`/api/conversations/${conversation._id}/messages`)
        .set("Authorization", `Bearer ${tokenB}`);
      expect(msgsB.body.data.some((m) => m._id === msg._id.toString())).toBe(true);
      expect(msgsB.body.data.find((m) => m._id === msg._id.toString()).text).toBe(
        "Delete for me test"
      );
    });

    it("should allow recipient to delete received message for themselves", async () => {
      const msg = await Message.create({
        conversation: conversation._id,
        sender: userA._id,
        text: "To be hidden by recipient",
      });

      const res = await request(app)
        .post(`/api/messages/${msg._id}/delete-for-me`)
        .set("Authorization", `Bearer ${tokenB}`);

      expect(res.status).toBe(200);

      // User B should not see it
      const msgsB = await request(app)
        .get(`/api/conversations/${conversation._id}/messages`)
        .set("Authorization", `Bearer ${tokenB}`);
      expect(msgsB.body.data.some((m) => m._id === msg._id.toString())).toBe(false);

      // User A still sees it
      const msgsA = await request(app)
        .get(`/api/conversations/${conversation._id}/messages`)
        .set("Authorization", `Bearer ${tokenA}`);
      expect(msgsA.body.data.some((m) => m._id === msg._id.toString())).toBe(true);
    });

    it("should return 404 when outsider calls delete-for-me", async () => {
      const msg = await Message.create({
        conversation: conversation._id,
        sender: userA._id,
        text: "Private",
      });

      const res = await request(app)
        .post(`/api/messages/${msg._id}/delete-for-me`)
        .set("Authorization", `Bearer ${tokenC}`);

      expect(res.status).toBe(404);
    });

    it("should return 400 for invalid message ObjectId", async () => {
      const res = await request(app)
        .post("/api/messages/invalid-id/delete-for-me")
        .set("Authorization", `Bearer ${tokenA}`);

      expect(res.status).toBe(400);
    });

    it("should be idempotent when called multiple times by the same user", async () => {
      const msg = await Message.create({
        conversation: conversation._id,
        sender: userA._id,
        text: "Idempotent test",
      });

      const res1 = await request(app)
        .post(`/api/messages/${msg._id}/delete-for-me`)
        .set("Authorization", `Bearer ${tokenA}`);
      expect(res1.status).toBe(200);

      const res2 = await request(app)
        .post(`/api/messages/${msg._id}/delete-for-me`)
        .set("Authorization", `Bearer ${tokenA}`);
      expect(res2.status).toBe(200);

      const inDb = await Message.findById(msg._id);
      expect(inDb.deletedFor.length).toBe(1);
    });

    it("should exclude delete-for-me messages from recipient's unread count", async () => {
      const msg = await Message.create({
        conversation: conversation._id,
        sender: userA._id,
        text: "Unread message",
      });

      let convs = await request(app)
        .get("/api/conversations")
        .set("Authorization", `Bearer ${tokenB}`);
      expect(convs.body.data[0].unreadCount).toBe(1);

      // User B deletes the message for me
      await request(app)
        .post(`/api/messages/${msg._id}/delete-for-me`)
        .set("Authorization", `Bearer ${tokenB}`);

      convs = await request(app)
        .get("/api/conversations")
        .set("Authorization", `Bearer ${tokenB}`);
      expect(convs.body.data[0].unreadCount).toBe(0);
    });

    it("should fallback conversation preview when latest message is deleted-for-me", async () => {
      const msg1 = await Message.create({
        conversation: conversation._id,
        sender: userA._id,
        text: "Earlier message",
      });
      const msg2 = await Message.create({
        conversation: conversation._id,
        sender: userA._id,
        text: "Latest message",
      });

      conversation.lastMessage = msg2._id;
      await conversation.save();

      // User B deletes msg2 for themselves
      await request(app)
        .post(`/api/messages/${msg2._id}/delete-for-me`)
        .set("Authorization", `Bearer ${tokenB}`);

      // User B's conversation preview should fall back to msg1
      const convsB = await request(app)
        .get("/api/conversations")
        .set("Authorization", `Bearer ${tokenB}`);
      expect(convsB.body.data[0].lastMessage._id.toString()).toBe(msg1._id.toString());
      expect(convsB.body.data[0].lastMessage.text).toBe("Earlier message");

      // User A's conversation preview should still be msg2
      const convsA = await request(app)
        .get("/api/conversations")
        .set("Authorization", `Bearer ${tokenA}`);
      expect(convsA.body.data[0].lastMessage._id.toString()).toBe(msg2._id.toString());
    });

    it("should return 404 on GET /api/files/:fileId for the user who deleted message for themselves", async () => {
      const fakeBuffer = Buffer.from("image data");
      const uploadRes = await request(app)
        .post(`/api/conversations/${conversation._id}/messages`)
        .set("Authorization", `Bearer ${tokenA}`)
        .attach("file", fakeBuffer, "delete_for_me.png");

      const msgId = uploadRes.body.data._id;
      const fileId = uploadRes.body.data.attachment.fileId;

      // User B deletes message for themselves
      await request(app)
        .post(`/api/messages/${msgId}/delete-for-me`)
        .set("Authorization", `Bearer ${tokenB}`);

      // User B gets 404
      const resB = await request(app)
        .get(`/api/files/${fileId}`)
        .set("Authorization", `Bearer ${tokenB}`);
      expect(resB.status).toBe(404);

      // User A can still download it
      const resA = await request(app)
        .get(`/api/files/${fileId}`)
        .set("Authorization", `Bearer ${tokenA}`);
      expect(resA.status).toBe(200);
    });
  });
});
