// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import viteReact from "@vitejs/plugin-react";
import tanstackRouter from "@tanstack/router-plugin/vite";
import react from "@astrojs/react";

const __dirname = path.resolve();

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  vite: {
    plugins: [
      tailwindcss(),
      tanstackRouter({
        target: "react",
        autoCodeSplitting: true,
        routesDirectory: path.resolve(__dirname, "./src/spa/routes"),
        generatedRouteTree: path.resolve(
          __dirname,
          "./src/spa/routes/routeTree.gen.ts"
        )
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
  }
});
