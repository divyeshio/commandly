import { docsNav } from "@/docs/nav";
import { cn } from "@/lib/utils";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/docs")({
  component: DocsLayout,
});

function DocsLayout() {
  return (
    <div className="flex min-h-screen pt-16">
      <aside className="fixed top-16 left-0 z-30 hidden h-[calc(100vh-4rem)] w-56 flex-col overflow-y-auto border-r bg-background py-8 pr-4 pl-6 lg:flex">
        {docsNav.map((section) => (
          <div
            key={section.section}
            className="mb-6"
          >
            <p className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              {section.section}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.name}>
                  <Link
                    to="/docs/$componentName"
                    params={{ componentName: item.name }}
                    className={cn(
                      "block rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                    )}
                    activeProps={{
                      className:
                        "block rounded-md px-2 py-1.5 text-sm text-accent-foreground! bg-accent font-medium",
                    }}
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </aside>
      <main className="min-w-0 flex-1 lg:pl-56">
        <Outlet />
      </main>
    </div>
  );
}
