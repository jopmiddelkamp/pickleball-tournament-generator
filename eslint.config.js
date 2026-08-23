import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/.next/**",
      "**/node_modules/**",
      "**/.turbo/**",
      "**/coverage/**",
      "**/next-env.d.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.es2022 },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // packages/core must stay portable: no browser or node globals, no framework imports.
    files: ["packages/core/src/**/*.ts"],
    languageOptions: { globals: {} },
    rules: {
      "no-restricted-properties": [
        "error",
        { object: "Math", property: "random", message: "Core is deterministic: use the seeded rng argument." },
        { object: "Date", property: "now", message: "Core is deterministic: no wall-clock reads." },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "NewExpression[callee.name='Date']",
          message: "Core is deterministic: no wall-clock reads.",
        },
      ],
    },
  },
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "packages/core/test/**/*.ts"],
    rules: { "no-restricted-properties": "off", "no-restricted-syntax": "off" },
  },
);
