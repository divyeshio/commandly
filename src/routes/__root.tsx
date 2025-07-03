/// <reference types="vite/client" />
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useLocation
} from "@tanstack/react-router";
import * as React from "react";
import type { QueryClient } from "@tanstack/react-query";
import { DefaultCatchBoundary } from "@/components/error-component";
import { NotFound } from "@/components/not-found";
import appCss from "../styles/app.css?url";
import { NuqsAdapter } from "nuqs/adapters/react";
import { Toaster } from "sonner";
import { ThemeProvider, ThemeSwitcher } from "@/components/theme-switcher";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { TerminalIcon } from "lucide-react";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8"
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1"
      }
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "/apple-touch-icon.png"
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        href: "/favicon-32x32.png"
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        href: "/favicon-16x16.png"
      },
      { rel: "manifest", href: "/site.webmanifest", color: "#fffff" },
      { rel: "icon", href: "/favicon.ico" }
    ]
  }),
  errorComponent: (props) => {
    return (
      <RootDocument>
        <DefaultCatchBoundary {...props} />
      </RootDocument>
    );
  },
  notFoundComponent: () => <NotFound />,
  component: RootComponent
});

function RootComponent() {
  return (
    <ThemeProvider>
      <RootDocument>
        <Outlet />
      </RootDocument>
    </ThemeProvider>
  );
}

function Navbar() {
  return (
    <nav className="w-full bg-transparent backdrop-blur supports-[backdrop-filter]:bg-background/60 fixed top-0 z-50 rounded-b-lg shadow-2xs">
      <div className="flex items-center h-16 px-8 gap-2 w-full">
        <div className="flex-1 flex items-center min-w-0">
          <Link
            to="/"
            className="text-lg tracking-tight whitespace-nowrap font-mono flex gap-1.5"
          >
            <TerminalIcon className="dark:stroke-primary" />
            Commandly
          </Link>
        </div>
        <div className="flex-1 flex justify-center gap-8 min-w-0">
          <Link
            to="/tools"
            className="font-serif hover:underline whitespace-nowrap"
          >
            Explore Tools
          </Link>
        </div>
        <div className="flex-1 flex items-center justify-end gap-4 min-w-0">
          <a
            href="https://github.com/divyeshio/commandly"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="hover:text-primary"
          >
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.157-1.11-1.465-1.11-1.465-.908-.62.069-.608.069-.608 1.004.07 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.339-2.221-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.987 1.029-2.686-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.295 2.748-1.025 2.748-1.025.546 1.378.202 2.397.1 2.65.64.699 1.028 1.593 1.028 2.686 0 3.847-2.337 4.695-4.566 4.944.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.749 0 .267.18.579.688.481C19.138 20.203 22 16.447 22 12.021 22 6.484 17.523 2 12 2z" />
            </svg>
          </a>
          <a
            href="https://twitter.com/divyeshio"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Twitter"
            className="hover:text-primary"
          >
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22.46 5.924c-.793.352-1.645.59-2.54.698a4.48 4.48 0 0 0 1.963-2.475 8.94 8.94 0 0 1-2.828 1.082A4.48 4.48 0 0 0 16.11 4c-2.485 0-4.5 2.015-4.5 4.5 0 .353.04.697.116 1.027C7.728 9.37 4.1 7.6 1.67 4.905c-.388.666-.61 1.44-.61 2.267 0 1.563.796 2.942 2.008 3.75-.74-.023-1.436-.227-2.045-.567v.057c0 2.185 1.555 4.008 3.623 4.426-.378.104-.776.16-1.187.16-.29 0-.57-.028-.844-.08.57 1.78 2.223 3.075 4.183 3.11A9.01 9.01 0 0 1 2 19.54a12.73 12.73 0 0 0 6.92 2.03c8.303 0 12.85-6.876 12.85-12.844 0-.196-.004-.392-.013-.586A9.22 9.22 0 0 0 24 4.59a8.98 8.98 0 0 1-2.54.697z" />
            </svg>
          </a>
          <a
            href="https://linkedin.com/in/divyeshio"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="hover:text-primary"
          >
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-11 19h-3v-10h3v10zm-1.5-11.28c-.966 0-1.75-.79-1.75-1.75s.784-1.75 1.75-1.75 1.75.79 1.75 1.75-.784 1.75-1.75 1.75zm13.5 11.28h-3v-5.6c0-1.34-.03-3.07-1.87-3.07-1.87 0-2.16 1.46-2.16 2.97v5.7h-3v-10h2.89v1.36h.04c.4-.76 1.38-1.56 2.84-1.56 3.04 0 3.6 2 3.6 4.59v5.61z" />
            </svg>
          </a>
          <ThemeSwitcher />
        </div>
      </div>
    </nav>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const pathname = useLocation({
    select: (location) => location.pathname
  });
  return (
    <html suppressHydrationWarning={true}>
      <head>
        <script src="/spa-redirect.js"></script>
        <HeadContent />
      </head>
      <body className="bg-background text-foreground antialiased">
        <NuqsAdapter>
          <Navbar />
          <main className={cn("w-full", pathname == "/" ? "" : "mt-16")}>
            {children}
          </main>
          <Toaster />
        </NuqsAdapter>
        {/* <TanStackRouterDevtools position="bottom-right" />
        <ReactQueryDevtools buttonPosition="bottom-left" /> */}
        <Scripts />
      </body>
    </html>
  );
}
