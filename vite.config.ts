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
      prerender: {
        enabled: true,
      },
      pages: [{
        path: "/",
        prerender: {
          enabled: true,
          autoSubfolderIndex: false,
          crawlLinks: true,
        },
      },
      {
        path: "/tools",
        prerender: {
          enabled: true,
          autoSubfolderIndex: false,
          crawlLinks: true,
        },
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
      target: "vercel-static"
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
