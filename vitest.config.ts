import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  // tsconfig.json est en jsx:preserve (Next.js) — transformer le JSX pour les
  // tests qui importent des templates emails/*.tsx, sans toucher au tsconfig.
  oxc: {
    jsx: {
      runtime: "automatic",
    },
  },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts", "app/**/*.test.ts", "types/**/*.test.ts"],
  },
});
