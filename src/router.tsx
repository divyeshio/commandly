import { DefaultCatchBoundary } from "./components/error-component";
import { NotFound } from "./components/not-found";
import { routeTree } from "./routeTree.gen";
import { createRouter } from "@tanstack/react-router";

export function getRouter() {
  return createRouter({
    routeTree,
    defaultStructuralSharing: true,
    defaultPreload: "intent",
    defaultViewTransition: true,
    defaultErrorComponent: DefaultCatchBoundary,
    defaultNotFoundComponent: () => <NotFound />,
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
