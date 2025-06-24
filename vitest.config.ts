import { defineConfig, mergeConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import viteConfig from "./vite.config.ts";

export default mergeConfig(
  viteConfig,
  defineConfig({
    plugins: [react(), tsconfigPaths()],
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["./tests/vitest.setup.ts"],
      coverage: {
        "provider": "v8",
        reporter: process.env.GITHUB_ACTIONS ? ['text', 'github-actions'] : ['text']
      }
    }
  })
);
