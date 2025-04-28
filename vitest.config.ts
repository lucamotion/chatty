import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./test/setup.ts"],
    globals: true,
    exclude: [
      "**/node_modules/**",
      "**/generated/**",
      "**/dist/**",
      "**config**",
      "**/types**",
    ],
    coverage: {
      exclude: [
        "**/node_modules/**",
        "**/generated/**",
        "**/dist/**",
        "**config**",
        "**/types**",
      ],
    },
  },
});
