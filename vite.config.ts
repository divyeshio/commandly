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
import tsConfigPaths from "vite-tsconfig-paths";

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
  plugins: [
    {
      enforce: "pre",
      ...mdx({
        remarkPlugins: [remarkGfm],
        rehypePlugins: [[rehypePrettyCode, options]],
      }),
    },
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
  server: {
    port: 4001,
  },
  define: {
    COMMIT_SHA: `"${process.env.GITHUB_SHA?.slice(0, 7).toString()}"`,
  },
});
