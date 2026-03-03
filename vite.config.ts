import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
export default defineConfig({
  plugins: [
    tsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tanstackStart({
      prerender: {
        enabled: true,
        crawlLinks: false,
      },
      pages: [
        {
          path: "/",
          prerender: {
            outputPath: "/index.html",
            enabled: true,
            crawlLinks: false,
          },
        },
        {
          path: "/tools",
          prerender: {
            outputPath: "/tools.html",
            enabled: true,
            crawlLinks: false,
          },
        },
      ],
      spa: {
        enabled: true,
        prerender: {
          outputPath: "/index.html",
          enabled: true,
          crawlLinks: false,
        },
      },
    }),
    viteReact(),
    tailwindcss(),
  ],
  server: {
    port: 4001,
  },
});
