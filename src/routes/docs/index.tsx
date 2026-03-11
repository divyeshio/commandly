import { demos } from "@/components/docs/demos";
import { docsNav } from "@/components/docs/nav";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/docs/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="mt-2 text-muted-foreground">
          Reusable components for building CLI tool UIs. Install with the shadcn CLI.
        </p>
      </div>
      {docsNav.map((section) => (
        <div
          key={section.section}
          className="mb-12"
        >
          <h2 className="mb-6 text-xl font-semibold">{section.section}</h2>
          <div className="flex flex-col gap-10">
            {section.items.map((item) => {
              const demo = demos[item.name];
              const DemoComponent = demo?.component;
              return (
                <div key={item.name}>
                  <Link
                    to="/docs/$componentName"
                    params={{ componentName: item.name }}
                    preload="intent"
                    className="mb-3 inline-block text-base font-semibold hover:underline"
                  >
                    {item.title}
                  </Link>
                  {DemoComponent && (
                    <div className="pointer-events-none select-none">
                      <DemoComponent />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
