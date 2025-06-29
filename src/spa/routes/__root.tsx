import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  CatchBoundary,
  createRootRouteWithContext,
  HeadContent,
  Outlet
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Link } from "@tanstack/react-router";

import { NotFound } from "@/components/not-found";
import { Toaster } from "@/components/ui/sonner";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { DefaultCatchBoundary } from "@/components/default-catch-boundary";
import { GithubIcon, LinkedinIcon, XIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
interface MyRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: RootComponent,
  head: () => ({
    meta: [
      {
        title: "Commandly"
      }
    ]
  }),
  notFoundComponent: () => <NotFound />
});

const queryClient = new QueryClient();

function RootComponent() {
  return (
    <div>
      <QueryClientProvider client={queryClient}>
        <ReactQueryDevtools />
        <HeadContent />
        <header className="flex h-16 items-center justify-between px-4">
          <div className="text-xl font-bold">
            <Link to="/">Commandly</Link>
          </div>
          <nav className="flex space-x-4">
            <Link to="/tools">Tools</Link>
            <Link to="/editor">Editor</Link>
          </nav>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" asChild>
              <a
                href="https://github.com/username/repo"
                target="_blank"
                rel="noopener noreferrer"
              >
                <GithubIcon />
              </a>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <a
                href="https://twitter.com/username"
                target="_blank"
                rel="noopener noreferrer"
              >
                <XIcon />
              </a>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <a
                href="https://linkedin.com/in/username"
                target="_blank"
                rel="noopener noreferrer"
              >
                <LinkedinIcon />
              </a>
            </Button>
            <ThemeSwitcher />
          </div>
        </header>
        <CatchBoundary
          getResetKey={() => "reset"}
          onCatch={(error, info) => console.error(error, info)}
          errorComponent={DefaultCatchBoundary}
        >
          <Outlet />
        </CatchBoundary>

        <Toaster />
        <TanStackRouterDevtools />
      </QueryClientProvider>
    </div>
  );
}
