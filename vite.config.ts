import { rmSync } from "node:fs";
import { resolve } from "node:path";

import mdx from "@mdx-js/rollup";
import githubDark from "@shikijs/themes/github-dark";
import githubLight from "@shikijs/themes/github-light";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import rehypePrettyCode from "rehype-pretty-code";
import remarkGfm from "remark-gfm";
import { createHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import { defineConfig } from "vite";

const options = {
  getHighlighter: () =>
    createHighlighterCore({
      themes: [githubDark, githubLight],
      langs: [import("@shikijs/langs/tsx")],
      engine: createJavaScriptRegexEngine(),
    }),

  theme: {
    light: "github-light",
    dark: "github-dark",
  },
};

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    {
      enforce: "pre",
      ...mdx({
        remarkPlugins: [remarkGfm],
        rehypePlugins: [[rehypePrettyCode, options]],
      }),
    },
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
        {
          path: "/docs",
          prerender: {
            outputPath: "/docs.html",
            enabled: true,
            crawlLinks: true,
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
    viteReact({ include: /\.(mdx|jsx|tsx)$/ }),
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      plugins: [
        {
          name: "exclude-tools-collection",
          closeBundle() {
            if (this.meta.watchMode) return;
            const dist = resolve(process.cwd(), "dist/client");
            rmSync(resolve(dist, "tools-collection"), { recursive: true, force: true });
            rmSync(resolve(dist, "tools.json"), { force: true });
          },
        },
      ],
    },
  },
  server: {
    port: 4001,
  },
  define: {
    COMMIT_SHA: `"${process.env.GITHUB_SHA?.slice(0, 7).toString()}"`,
  },
});
