import tseslint from "typescript-eslint";
import security from "eslint-plugin-security";
import react from "eslint-plugin-react";

export default [
  {
    ignores: ["node_modules/**", ".next/**", "next-env.d.ts"],
  },
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: { security, react },
    rules: {
      ...security.configs.recommended.rules,
      "react/no-danger": "error",
    },
  },
];
