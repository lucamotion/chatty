import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig([
  {
    ignores: [
      "eslint.config.mjs",
      "src/**/*.test.ts",
      "src/generated/**",
      "test/*",
      "vitest.config.ts",
    ],
  },
  { files: ["src/**/*.ts"] },
  // @ts-ignore - this error is too long and its just eslint and it works fine so i dont really care
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        project: "./tsconfig.json",
      },
    },
    rules: {
      "@typescript-eslint/array-type": ["error", { default: "generic" }],
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/ban-ts-comment": "error",
      "@typescript-eslint/consistent-generic-constructors": "error",
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: false },
      ],
      "@typescript-eslint/only-throw-error": "error",
      curly: ["error", "all"],
      "@typescript-eslint/no-unused-vars": "error",
    },
  },
]);
