import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import http from "node:http";
import { io as ioClient } from "socket.io-client";
import app from "../src/app.js";
import { initializeSocket } from "../src/sockets/index.js";
import Conversation from "../src/models/Conversation.js";
import { createUser, getAuthToken } from "./helpers.js";

describe("Socket.IO Chat & Presence", () => {
  let server;
  let port;
  let userA, tokenA;
  let userB, tokenB;
  let userC, tokenC;
  let conversation;

  beforeAll(async () => {
    server = http.createServer(app);
    initializeSocket(server);
    await new Promise((resolve) => server.listen(0, resolve));
    port = server.address().port;
  });

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  beforeEach(async () => {
    userA = await createUser({ email: "sock_a@example.com" });
    tokenA = getAuthToken(userA._id);

    userB = await createUser({ email: "sock_b@example.com" });
    tokenB = getAuthToken(userB._id);

    userC = await createUser({ email: "sock_c@example.com" });
    tokenC = getAuthToken(userC._id);

    conversation = await Conversation.create({
      participants: [userA._id, userB._id],
      participantsKey: Conversation.getParticipantsKey(userA._id, userB._id),
    });
  });

  it("should connect successfully with a valid JWT token", async () => {
    const client = ioClient(`http://localhost:${port}`, {
      auth: { token: tokenA },
      transports: ["websocket"],
    });

    await new Promise((resolve, reject) => {
      client.on("connect", resolve);
      client.on("connect_error", reject);
    });

    expect(client.connected).toBe(true);
    client.disconnect();
  });

  it("should reject connection when no token is provided", async () => {
    const client = ioClient(`http://localhost:${port}`, {
      transports: ["websocket"],
    });

    const error = await new Promise((resolve) => {
      client.on("connect_error", resolve);
    });

    expect(error.message).toContain("Authentication error");
    client.disconnect();
  });

  it("should send message via message:send and broadcast message:new to recipient", async () => {
    const clientA = ioClient(`http://localhost:${port}`, {
      auth: { token: tokenA },
      transports: ["websocket"],
    });
    const clientB = ioClient(`http://localhost:${port}`, {
      auth: { token: tokenB },
      transports: ["websocket"],
    });

    await Promise.all([
      new Promise((res) => clientA.on("connect", res)),
      new Promise((res) => clientB.on("connect", res)),
    ]);

    // Setup listener on Client B for incoming message:new
    const messagePromise = new Promise((resolve) => {
      clientB.on("message:new", (msg) => {
        resolve(msg);
      });
    });

    // Client A sends message with acknowledgement callback
    const ack = await new Promise((resolve) => {
      clientA.emit(
        "message:send",
        {
          conversationId: conversation._id.toString(),
          text: "Hello from User A!",
        },
        resolve
      );
    });

    expect(ack.ok).toBe(true);
    expect(ack.message.text).toBe("Hello from User A!");

    const receivedMsg = await messagePromise;
    expect(receivedMsg.text).toBe("Hello from User A!");
    expect(receivedMsg.sender._id.toString()).toBe(userA._id.toString());

    clientA.disconnect();
    clientB.disconnect();
  });

  it("should reject message:send if sender is not a participant in the conversation", async () => {
    const clientC = ioClient(`http://localhost:${port}`, {
      auth: { token: tokenC },
      transports: ["websocket"],
    });

    await new Promise((res) => clientC.on("connect", res));

    const ack = await new Promise((resolve) => {
      clientC.emit(
        "message:send",
        {
          conversationId: conversation._id.toString(),
          text: "Hacker message!",
        },
        resolve
      );
    });

    expect(ack.ok).toBe(false);
    expect(ack.error).toContain("not a participant");

    clientC.disconnect();
  });
});
