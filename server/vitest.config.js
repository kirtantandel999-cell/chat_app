import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    fileParallelism: false,
    setupFiles: ["tests/setup.js"],
    hookTimeout: 120000,
    testTimeout: 60000,
  },
});
