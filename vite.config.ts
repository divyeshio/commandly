import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import path from "path";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
export default defineConfig({
  plugins: [
    tsConfigPaths({
      projects: ["./tsconfig.json"]
    }),
    tanstackStart({
      spa: {
        enabled: true,
        prerender: {
          autoSubfolderIndex: true,
          crawlLinks: true
        }
      },
      target: "vercel"
    })
  ],
  server: {
    port: 4001
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  }
});
