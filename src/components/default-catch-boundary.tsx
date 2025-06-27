import {
  ErrorComponent,
  Link,
  rootRouteId,
  useMatch,
  useRouter,
} from "@tanstack/react-router";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { Button } from "./ui/button";

export function DefaultCatchBoundary({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  const isRoot = useMatch({
    strict: false,
    select: (state) => state.routeId === rootRouteId,
  });

  console.error("DefaultCatchBoundary Error:", error);

  return (
    <div className="min-w-0 flex-1 p-4 flex flex-col items-center justify-center gap-6">
      <ErrorComponent error={error} />
      <pre>{error.stack}</pre>
      <div className="flex gap-2 items-center flex-wrap">
        <Button
          onClick={() => {
            router.invalidate();
          }}
          className="uppercase font-extrabold"
        >
          Try Again
        </Button>
        <Button
          onClick={() => {
            reset();
          }}
          className="uppercase font-extrabold"
        >
          Reset
        </Button>
        {isRoot ? (
          <Button asChild className="uppercase font-extrabold">
            <Link to="/" reloadDocument={true}>
              Home
            </Link>
          </Button>
        ) : (
          <Button asChild className="uppercase font-extrabold">
            <Link
              to="/"
              onClick={(e) => {
                e.preventDefault();
                router.history.back();
                reset();
              }}
            >
              Go Back
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
