import { docsNav } from "@/components/docs/nav";
import { cn } from "@/lib/utils";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/docs")({
  component: DocsLayout,
});

function DocsLayout() {
  return (
    <div className="flex border-t border-muted">
      <aside className="h-screen w-64 max-w-xs min-w-50 overflow-y-auto border-r-2 border-muted p-4">
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
                    activeOptions={{ exact: true }}
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </aside>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
