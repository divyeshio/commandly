import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [
    tsConfigPaths({
      projects: ["./tsconfig.json"]
    }),
    tanstackStart({
      target: "github-pages",
      prerender: {
        enabled: true,
      },
      pages: [
        {
          path: "/",
          prerender: {
            outputPath: "index.html",
            autoSubfolderIndex: true,
            enabled: true,
            crawlLinks: true
          }
        },
      ],
      spa: {
        enabled: true,
        prerender: {
          enabled: true,
          crawlLinks: true
        }
      },
    }),
    viteReact()
  ],
  server: {
    port: 4001
  }
});
