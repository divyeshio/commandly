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
      pages: [
        {
          path: "/",
          prerender: {
            enabled: true,
            autoSubfolderIndex: false,
            crawlLinks: false
          }
        },
        {
          path: "/tools",
          prerender: {
            enabled: true,
            autoSubfolderIndex: false,
            crawlLinks: false
          }
        }
      ],
      spa: {
        enabled: true,
        prerender: {
          enabled: true,
          autoSubfolderIndex: true,
          crawlLinks: true
        }
      },
      target: "github-pages"
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
