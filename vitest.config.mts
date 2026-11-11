import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    environment: "node",
    testTimeout: 15_000,
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", "tests/e2e/**", ".next/**", "generated/**"],
    env: {
      DEMO_TODAY: "2026-11-05",
    },
  },
});
