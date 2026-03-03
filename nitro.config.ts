import { defineConfig } from "nitro";

export default defineConfig({
  vercel: {
    config: {
      version: 3,
      routes: [
        {
          src: "/tools",
          handle: "filesystem"
        }
      ]
    }
  }
});
