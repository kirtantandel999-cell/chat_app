import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import Conversation from "../src/models/Conversation.js";
import Message from "../src/models/Message.js";
import { createUser, getAuthToken } from "./helpers.js";
import { clearUploadRateLimits } from "../src/utils/fileUtils.js";

describe("Attachment & File Sharing Endpoints", () => {
  let userA, tokenA;
  let userB, tokenB;
  let userC, tokenC;
  let conversation;

  beforeEach(async () => {
    clearUploadRateLimits();

    userA = await createUser({ email: "user_a_files@example.com" });
    tokenA = getAuthToken(userA._id);

    userB = await createUser({ email: "user_b_files@example.com" });
    tokenB = getAuthToken(userB._id);

    userC = await createUser({ email: "user_c_files@example.com" });
    tokenC = getAuthToken(userC._id);

    conversation = await Conversation.create({
      participants: [userA._id, userB._id],
      participantsKey: Conversation.getParticipantsKey(userA._id, userB._id),
    });
  });

  it("should successfully upload an image and create a message with attachment metadata", async () => {
    const fakeImageBuffer = Buffer.from("fake-jpeg-binary-content");

    const res = await request(app)
      .post(`/api/conversations/${conversation._id}/messages`)
      .set("Authorization", `Bearer ${tokenA}`)
      .field("text", "Check out this photo")
      .attach("file", fakeImageBuffer, "vacation.jpg");

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.text).toBe("Check out this photo");
    expect(res.body.data.attachment).toBeDefined();
    expect(res.body.data.attachment.filename).toBe("vacation.jpg");
    expect(res.body.data.attachment.mimeType).toBe("image/jpeg");
    expect(res.body.data.attachment.kind).toBe("image");
    expect(res.body.data.attachment.fileId).toBeDefined();

    // Verify conversation lastMessage updated
    const updatedConv = await Conversation.findById(conversation._id);
    expect(updatedConv.lastMessage.toString()).toBe(res.body.data._id);
  });

  it("should successfully upload a PDF document and mark kind as 'file'", async () => {
    const fakePdfBuffer = Buffer.from("%PDF-1.4 fake pdf data");

    const res = await request(app)
      .post(`/api/conversations/${conversation._id}/messages`)
      .set("Authorization", `Bearer ${tokenB}`)
      .attach("file", fakePdfBuffer, "contract.pdf");

    expect(res.status).toBe(201);
    expect(res.body.data.attachment.kind).toBe("file");
    expect(res.body.data.attachment.filename).toBe("contract.pdf");
    expect(res.body.data.attachment.mimeType).toBe("application/pdf");
  });

  it("should reject disallowed file types with 400", async () => {
    const fakeExeBuffer = Buffer.from("MZ fake executable");

    const res = await request(app)
      .post(`/api/conversations/${conversation._id}/messages`)
      .set("Authorization", `Bearer ${tokenA}`)
      .attach("file", fakeExeBuffer, "dangerous.exe");

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/File type not allowed/i);
  });

  it("should reject SVG files with 400", async () => {
    const fakeSvg = Buffer.from("<svg><script>alert(1)</script></svg>");

    const res = await request(app)
      .post(`/api/conversations/${conversation._id}/messages`)
      .set("Authorization", `Bearer ${tokenA}`)
      .attach("file", fakeSvg, "vector.svg");

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should reject files exceeding max file size with 413", async () => {
    // 10 MB + 1 byte
    const largeBuffer = Buffer.alloc(10 * 1024 * 1024 + 10);

    const res = await request(app)
      .post(`/api/conversations/${conversation._id}/messages`)
      .set("Authorization", `Bearer ${tokenA}`)
      .attach("file", largeBuffer, "huge.jpg");

    expect(res.status).toBe(413);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/File too large/i);
  });

  it("should reject non-participant uploading to a conversation with 404", async () => {
    const fakeBuffer = Buffer.from("some text content");

    const res = await request(app)
      .post(`/api/conversations/${conversation._id}/messages`)
      .set("Authorization", `Bearer ${tokenC}`)
      .attach("file", fakeBuffer, "notes.txt");

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("should download an uploaded file for a participant with proper headers", async () => {
    const fileContent = "This is a secret document content.";
    const buffer = Buffer.from(fileContent);

    // Upload
    const uploadRes = await request(app)
      .post(`/api/conversations/${conversation._id}/messages`)
      .set("Authorization", `Bearer ${tokenA}`)
      .attach("file", buffer, "report.txt");

    expect(uploadRes.status).toBe(201);
    const fileId = uploadRes.body.data.attachment.fileId;

    // Download by participant userB
    const downloadRes = await request(app)
      .get(`/api/files/${fileId}`)
      .set("Authorization", `Bearer ${tokenB}`);

    expect(downloadRes.status).toBe(200);
    expect(downloadRes.headers["content-type"]).toBe("text/plain");
    expect(downloadRes.headers["x-content-type-options"]).toBe("nosniff");
    expect(downloadRes.headers["content-disposition"]).toContain('attachment; filename="report.txt"');
    expect(downloadRes.text).toBe(fileContent);
  });

  it("should return inline disposition for images", async () => {
    const imgBuffer = Buffer.from("fake-png-bytes");

    const uploadRes = await request(app)
      .post(`/api/conversations/${conversation._id}/messages`)
      .set("Authorization", `Bearer ${tokenA}`)
      .attach("file", imgBuffer, "avatar.png");

    expect(uploadRes.status).toBe(201);
    const fileId = uploadRes.body.data.attachment.fileId;

    const downloadRes = await request(app)
      .get(`/api/files/${fileId}`)
      .set("Authorization", `Bearer ${tokenA}`);

    expect(downloadRes.status).toBe(200);
    expect(downloadRes.headers["content-disposition"]).toContain('inline; filename="avatar.png"');
  });

  it("should return 404 when non-participant attempts to download a file", async () => {
    const fileContent = "Private data";
    const uploadRes = await request(app)
      .post(`/api/conversations/${conversation._id}/messages`)
      .set("Authorization", `Bearer ${tokenA}`)
      .attach("file", Buffer.from(fileContent), "private.pdf");

    const fileId = uploadRes.body.data.attachment.fileId;

    // User C is not in conversation
    const downloadRes = await request(app)
      .get(`/api/files/${fileId}`)
      .set("Authorization", `Bearer ${tokenC}`);

    expect(downloadRes.status).toBe(404);
  });
});
