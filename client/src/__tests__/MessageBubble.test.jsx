import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import MessageBubble from "../components/MessageBubble";

vi.mock("../hooks/useFileUrl", () => ({
  default: vi.fn((fileId) => {
    if (!fileId) return { url: null, loading: false, error: null };
    if (fileId === "loading-id") return { url: null, loading: true, error: null };
    if (fileId === "error-id") return { url: null, loading: false, error: "Failed to load" };
    return { url: `blob:http://localhost/${fileId}`, loading: false, error: null };
  }),
}));

describe("MessageBubble Component", () => {
  it("renders own message with right alignment and primary color styling", () => {
    const message = {
      _id: "m1",
      text: "Hey there!",
      createdAt: new Date().toISOString(),
    };

    const { container } = render(<MessageBubble message={message} isOwn={true} />);

    expect(screen.getByText("Hey there!")).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("justify-end");
    expect(screen.getByText("Hey there!").closest("div")).toHaveClass("bg-primary-600");
  });

  it("renders recipient message with left alignment and white card styling", () => {
    const message = {
      _id: "m2",
      text: "How are you doing?",
      createdAt: new Date().toISOString(),
    };

    const { container } = render(<MessageBubble message={message} isOwn={false} />);

    expect(screen.getByText("How are you doing?")).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("justify-start");
    expect(screen.getByText("How are you doing?").closest("div")).toHaveClass("bg-white");
  });

  it("renders image thumbnail wrapped in a direct new-tab anchor link when loaded", () => {
    const message = {
      _id: "m3",
      text: "Look at this view",
      attachment: {
        fileId: "img123",
        filename: "sunset.jpg",
        mimeType: "image/jpeg",
        size: 204800,
        kind: "image",
      },
      createdAt: new Date().toISOString(),
    };

    render(<MessageBubble message={message} isOwn={false} />);

    expect(screen.getByText("Look at this view")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /open image in new tab/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "blob:http://localhost/img123");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");

    const img = screen.getByAltText("sunset.jpg");
    expect(img).toHaveAttribute("src", "blob:http://localhost/img123");
  });

  it("renders loading placeholder with no anchor link while image is loading", () => {
    const message = {
      _id: "m4",
      attachment: {
        fileId: "loading-id",
        filename: "loading.jpg",
        kind: "image",
      },
      createdAt: new Date().toISOString(),
    };

    render(<MessageBubble message={message} isOwn={false} />);

    expect(screen.getByText(/loading image/i)).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders generic file card with filename, size, and download button", () => {
    const message = {
      _id: "m5",
      attachment: {
        fileId: "doc123",
        filename: "annual_report.pdf",
        mimeType: "application/pdf",
        size: 1048576, // 1 MB
        kind: "file",
      },
      createdAt: new Date().toISOString(),
    };

    render(<MessageBubble message={message} isOwn={false} />);

    expect(screen.getByText("annual_report.pdf")).toBeInTheDocument();
    expect(screen.getByText("1 MB")).toBeInTheDocument();

    const downloadLink = screen.getByRole("link", {
      name: /download annual_report\.pdf/i,
    });
    expect(downloadLink).toBeInTheDocument();
    expect(downloadLink).toHaveAttribute("href", "blob:http://localhost/doc123");
    expect(downloadLink).toHaveAttribute("download", "annual_report.pdf");
  });

  it("shows options button for both own messages and received messages", () => {
    const ownMessage = {
      _id: "m6",
      text: "My message",
      createdAt: new Date().toISOString(),
    };
    const { rerender } = render(<MessageBubble message={ownMessage} isOwn={true} />);
    expect(screen.getByRole("button", { name: /message options/i })).toBeInTheDocument();

    const otherMessage = {
      _id: "m7",
      text: "Other message",
      createdAt: new Date().toISOString(),
    };
    rerender(<MessageBubble message={otherMessage} isOwn={false} />);
    expect(screen.getByRole("button", { name: /message options/i })).toBeInTheDocument();
  });

  it("shows both Delete for me and Delete for everyone for own message dropdown", () => {
    const ownMessage = {
      _id: "m8",
      text: "My message with options",
      createdAt: new Date().toISOString(),
    };
    render(<MessageBubble message={ownMessage} isOwn={true} />);

    const optionsBtn = screen.getByRole("button", { name: /message options/i });
    expect(optionsBtn).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(optionsBtn);
    expect(optionsBtn).toHaveAttribute("aria-expanded", "true");

    expect(screen.getByRole("menuitem", { name: /delete for me/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /delete for everyone/i })).toBeInTheDocument();
  });

  it("shows only Delete for me for received messages dropdown", () => {
    const otherMessage = {
      _id: "m9",
      text: "Received message",
      createdAt: new Date().toISOString(),
    };
    render(<MessageBubble message={otherMessage} isOwn={false} />);

    const optionsBtn = screen.getByRole("button", { name: /message options/i });
    fireEvent.click(optionsBtn);

    expect(screen.getByRole("menuitem", { name: /delete for me/i })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: /delete for everyone/i })).not.toBeInTheDocument();
  });

  it("renders muted italic 'This message was deleted' placeholder with Delete for me menu", () => {
    const deletedMsg = {
      _id: "m10",
      text: "",
      attachment: null,
      deletedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    render(<MessageBubble message={deletedMsg} isOwn={true} />);

    expect(screen.getByText("This message was deleted")).toBeInTheDocument();

    const optionsBtn = screen.getByRole("button", { name: /message options/i });
    fireEvent.click(optionsBtn);

    expect(screen.getByRole("menuitem", { name: /delete for me/i })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: /delete for everyone/i })).not.toBeInTheDocument();
  });
});
