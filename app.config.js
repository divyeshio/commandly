import { defineConfig } from "@tanstack/react-start/config";

export default defineConfig({
  server: {
    prerender: {
      routes: ["/"],
      crawlLinks: true,
    },
  },
});
