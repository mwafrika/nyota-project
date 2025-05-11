import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { js },
    extends: ["js/recommended"],
    rules: {
      // "no-console": "error",
      "no-undef": "error",
      "no-unused-vars": "error",
      "no-var": "error",
      "prefer-const": "error",
      eqeqeq: ["error", "always"],
      "no-duplicate-imports": "error",
    },
    ignores: [
      "**/database/**",
      "**/node_modules/**",
      "**/config/**",
      "**/src/server.js",
      "**/src/app.js",
    ],
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: { globals: globals.browser },
  },
]);
