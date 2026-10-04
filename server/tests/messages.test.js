import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import Conversation from "../src/models/Conversation.js";
import Message from "../src/models/Message.js";
import { createUser, getAuthToken } from "./helpers.js";

describe("Messages & Read Status Endpoints", () => {
  let userA, tokenA;
  let userB, tokenB;
  let conversation;

  beforeEach(async () => {
    userA = await createUser({ email: "usera_msg@example.com" });
    tokenA = getAuthToken(userA._id);

    userB = await createUser({ email: "userb_msg@example.com" });
    tokenB = getAuthToken(userB._id);

    conversation = await Conversation.create({
      participants: [userA._id, userB._id],
      participantsKey: Conversation.getParticipantsKey(userA._id, userB._id),
    });
  });

  it("should return messages in chronological order with cursor pagination", async () => {
    // Create 5 messages
    const msg1 = await Message.create({ conversation: conversation._id, sender: userA._id, text: "Msg 1" });
    const msg2 = await Message.create({ conversation: conversation._id, sender: userB._id, text: "Msg 2" });
    const msg3 = await Message.create({ conversation: conversation._id, sender: userA._id, text: "Msg 3" });
    const msg4 = await Message.create({ conversation: conversation._id, sender: userB._id, text: "Msg 4" });
    const msg5 = await Message.create({ conversation: conversation._id, sender: userA._id, text: "Msg 5" });

    // Request messages with limit 2 (should return the 2 most recent: msg4, msg5, in chronological order)
    const resRecent = await request(app)
      .get(`/api/conversations/${conversation._id}/messages?limit=2`)
      .set("Authorization", `Bearer ${tokenA}`);

    expect(resRecent.status).toBe(200);
    expect(resRecent.body.data).toHaveLength(2);
    expect(resRecent.body.data[0].text).toBe("Msg 4");
    expect(resRecent.body.data[1].text).toBe("Msg 5");

    // Request messages before msg4
    const resBefore = await request(app)
      .get(`/api/conversations/${conversation._id}/messages?before=${msg4._id}&limit=2`)
      .set("Authorization", `Bearer ${tokenA}`);

    expect(resBefore.status).toBe(200);
    expect(resBefore.body.data).toHaveLength(2);
    expect(resBefore.body.data[0].text).toBe("Msg 2");
    expect(resBefore.body.data[1].text).toBe("Msg 3");
  });

  it("should mark messages as read and decrease unreadCount", async () => {
    // User B sends 2 messages to User A
    await Message.create({ conversation: conversation._id, sender: userB._id, text: "Unread 1" });
    await Message.create({ conversation: conversation._id, sender: userB._id, text: "Unread 2" });

    // Check User A's conversations list -> unreadCount should be 2
    const convsBefore = await request(app)
      .get("/api/conversations")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(convsBefore.status).toBe(200);
    expect(convsBefore.body.data[0].unreadCount).toBe(2);

    // User A reads conversation
    const readRes = await request(app)
      .post(`/api/conversations/${conversation._id}/read`)
      .set("Authorization", `Bearer ${tokenA}`);

    expect(readRes.status).toBe(200);
    expect(readRes.body.success).toBe(true);

    // Check User A's conversations list -> unreadCount should be 0
    const convsAfter = await request(app)
      .get("/api/conversations")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(convsAfter.status).toBe(200);
    expect(convsAfter.body.data[0].unreadCount).toBe(0);
  });
});
