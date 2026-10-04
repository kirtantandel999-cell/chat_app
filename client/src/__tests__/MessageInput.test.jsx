import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import MessageInput from "../components/MessageInput";

describe("MessageInput Component", () => {
  it("renders textarea, attach button, and disabled send button initially", () => {
    render(<MessageInput onSendMessage={vi.fn()} />);

    const textarea = screen.getByPlaceholderText(/type a message/i);
    const sendButton = screen.getByRole("button", { name: /send message/i });
    const attachButton = screen.getByRole("button", { name: /attach file/i });

    expect(textarea).toBeInTheDocument();
    expect(sendButton).toBeDisabled();
    expect(attachButton).toBeInTheDocument();
  });

  it("enables send button when text is typed and calls onSendMessage on click", () => {
    const handleSend = vi.fn();
    render(<MessageInput onSendMessage={handleSend} />);

    const textarea = screen.getByPlaceholderText(/type a message/i);
    fireEvent.change(textarea, { target: { value: "Hello world!" } });

    const sendButton = screen.getByRole("button", { name: /send message/i });
    expect(sendButton).not.toBeDisabled();

    fireEvent.click(sendButton);
    expect(handleSend).toHaveBeenCalledWith("Hello world!");
    expect(textarea.value).toBe("");
  });

  it("submits message on Enter key without shift", () => {
    const handleSend = vi.fn();
    render(<MessageInput onSendMessage={handleSend} />);

    const textarea = screen.getByPlaceholderText(/type a message/i);
    fireEvent.change(textarea, { target: { value: "Enter test" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });

    expect(handleSend).toHaveBeenCalledWith("Enter test");
  });

  it("does not submit message on Shift+Enter", () => {
    const handleSend = vi.fn();
    render(<MessageInput onSendMessage={handleSend} />);

    const textarea = screen.getByPlaceholderText(/type a message/i);
    fireEvent.change(textarea, { target: { value: "Multiline test" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });

    expect(handleSend).not.toHaveBeenCalled();
  });

  it("handles valid file selection, shows preview strip, and removes file on remove click", () => {
    const { container } = render(<MessageInput onSendMessage={vi.fn()} />);

    const fileInput = container.querySelector('input[type="file"]');
    const validFile = new File(["dummy content"], "invoice.pdf", {
      type: "application/pdf",
    });

    fireEvent.change(fileInput, { target: { files: [validFile] } });

    expect(screen.getByText("invoice.pdf")).toBeInTheDocument();
    const removeBtn = screen.getByRole("button", { name: /remove attached file/i });
    expect(removeBtn).toBeInTheDocument();

    // Remove file
    fireEvent.click(removeBtn);
    expect(screen.queryByText("invoice.pdf")).not.toBeInTheDocument();
  });

  it("shows error alert on disallowed file type", () => {
    const { container } = render(<MessageInput onSendMessage={vi.fn()} />);

    const fileInput = container.querySelector('input[type="file"]');
    const badFile = new File(["virus"], "script.exe", {
      type: "application/x-msdownload",
    });

    fireEvent.change(fileInput, { target: { files: [badFile] } });

    expect(
      screen.getByText(/file type "\.exe" is not permitted/i)
    ).toBeInTheDocument();
  });

  it("calls onSendAttachment when sending an attachment with optional caption", async () => {
    const handleSendAttachment = vi.fn().mockResolvedValue({ _id: "new_msg" });
    const { container } = render(
      <MessageInput
        onSendMessage={vi.fn()}
        onSendAttachment={handleSendAttachment}
      />
    );

    const fileInput = container.querySelector('input[type="file"]');
    const imageFile = new File(["fake-image-bytes"], "photo.png", {
      type: "image/png",
    });

    fireEvent.change(fileInput, { target: { files: [imageFile] } });

    // Type optional caption
    const textarea = screen.getByPlaceholderText(/add a caption/i);
    fireEvent.change(textarea, { target: { value: "Nice view!" } });

    const sendButton = screen.getByRole("button", { name: /send message/i });
    expect(sendButton).not.toBeDisabled();

    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(handleSendAttachment).toHaveBeenCalledWith(
        imageFile,
        "Nice view!",
        expect.any(Function)
      );
    });
  });
});
