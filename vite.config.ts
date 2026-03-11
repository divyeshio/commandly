import mdx from "@mdx-js/rollup";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import rehypePrettyCode from "rehype-pretty-code";
import remarkGfm from "remark-gfm";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
export default defineConfig({
  plugins: [
    {
      enforce: "pre",
      ...mdx({
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          [
            rehypePrettyCode,
            {
              theme: {
                light: "github-light",
                dark: "github-dark-dimmed",
              },
            },
          ],
        ],
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
          path: "/docs/",
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
