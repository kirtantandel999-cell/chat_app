import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, renderHook } from "@testing-library/react";
import { ThemeProvider } from "../context/ThemeContext";
import ThemeToggle from "../components/ThemeToggle";
import useTheme from "../hooks/useTheme";

describe("Theme System & ThemeToggle Component", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
  });

  it("throws a clear error when useTheme is used outside ThemeProvider", () => {
    // Suppress console.error for expected error boundary log
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      renderHook(() => useTheme());
    }).toThrow("useTheme must be used within a ThemeProvider");

    consoleSpy.mockRestore();
  });

  it("selecting Dark adds the 'dark' class to <html> and saves 'dark' to localStorage", () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const darkBtn = screen.getByRole("button", { name: /dark mode/i });
    fireEvent.click(darkBtn);

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("theme")).toBe("dark");
    expect(darkBtn).toHaveAttribute("aria-pressed", "true");
  });

  it("selecting Light removes the 'dark' class from <html> and saves 'light' to localStorage", () => {
    // Start in dark mode
    localStorage.setItem("theme", "dark");

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    expect(document.documentElement.classList.contains("dark")).toBe(true);

    const lightBtn = screen.getByRole("button", { name: /light mode/i });
    fireEvent.click(lightBtn);

    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(localStorage.getItem("theme")).toBe("light");
    expect(lightBtn).toHaveAttribute("aria-pressed", "true");
  });

  it("selecting System follows a mocked matchMedia query", () => {
    // Mock matchMedia to match dark
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query.includes("prefers-color-scheme: dark"),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const systemBtn = screen.getByRole("button", { name: /system mode/i });
    fireEvent.click(systemBtn);

    expect(localStorage.getItem("theme")).toBe("system");
    expect(systemBtn).toHaveAttribute("aria-pressed", "true");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
