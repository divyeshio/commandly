import { RouterProvider, createRouter } from "@tanstack/react-router";
import "../styles/global.css";
import Styles from "./styles.module.css";
// Import the generated route tree
import { routeTree } from "./routeTree.gen";
import { NotFound } from "./components/not-found";
import { QueryClient } from "@tanstack/react-query";

// Create a new router instance
const router = createRouter({
  routeTree,
  basepath: "/toolsa/",
  defaultPreload: "intent",
  defaultStaleTime: Infinity,
  defaultViewTransition: true,
  defaultStructuralSharing: true,
  defaultNotFoundComponent: () => <NotFound />,
  context: {
    queryClient: new QueryClient()
  }
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export function App() {
  return <RouterProvider router={router} />;
}
