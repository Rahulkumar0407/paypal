import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Import boundaries from AGENTS.md sections 6 and 9.
// 1. Modules are imported through their index (`@/lib/<module>`), never deeper.
//    lib/shared is the exception: import its files directly (`@/lib/shared/money`).
// 2. Only the Guard, the PayPal module, app/api/paypal and app/store may import `@/lib/paypal`.
// 3. Only lib/ai/model.ts may import an AI provider package.
const deepModuleImports = {
  group: ["@/lib/*/*", "!@/lib/shared/*", "!@/lib/auth/actions"],
  message:
    "Import a module through its index (@/lib/<module>). Only lib/shared files and server actions may be imported directly. See AGENTS.md section 9.",
};
const paypal = {
  name: "@/lib/paypal",
  message:
    "Only the Margin Guard (lib/guard), app/api/paypal and app/store may call PayPal. See AGENTS.md section 6.",
};
const providers = ["@ai-sdk/google", "@openrouter/ai-sdk-provider"].map((name) => ({
  name,
  message: "All AI provider setup lives in lib/ai/model.ts. See AGENTS.md section 5.",
}));

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["**/*.{ts,tsx,mts}"],
    rules: {
      "no-restricted-imports": ["error", { paths: [paypal, ...providers], patterns: [deepModuleImports] }],
    },
  },
  {
    files: ["lib/guard/**", "lib/paypal/**", "app/api/paypal/**", "app/store/**"],
    rules: {
      "no-restricted-imports": ["error", { paths: [...providers], patterns: [deepModuleImports] }],
    },
  },
  {
    files: ["lib/ai/model.ts"],
    rules: {
      "no-restricted-imports": ["error", { paths: [paypal], patterns: [deepModuleImports] }],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "generated/**",
    "playwright-report/**",
    "test-results/**",
    ".claude/**",
  ]),
]);

export default eslintConfig;
