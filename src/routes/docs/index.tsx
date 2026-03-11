import { docsNav } from "@/docs/nav";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/docs/")({
  component: RouteComponent,
});

function RouteComponent() {
  const allItems = docsNav.flatMap((s) => s.items);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Components</h1>
        <p className="mt-2 text-muted-foreground">
          Reusable components for building CLI tool UIs. Install with the shadcn CLI.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {allItems.map((item) => (
          <Link
            key={item.name}
            to="/docs/$componentName"
            params={{ componentName: item.name }}
            preload="intent"
            className="group flex flex-col gap-2 rounded-lg border bg-card p-5 transition-colors hover:bg-accent"
          >
            <span className="text-base font-semibold group-hover:text-accent-foreground">
              {item.title}
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              {`npx shadcn@latest add https://commandly.divyeshio.in/r/${item.name}.json`}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
