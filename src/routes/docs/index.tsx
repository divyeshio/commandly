import { demos } from "@/components/docs/demos";
import { docsNav } from "@/components/docs/nav";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/docs/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="mx-auto w-full max-w-4xl min-w-0 px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <div className="mb-8 sm:mb-10">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Overview</h1>
        <p className="mt-2 text-muted-foreground">
          Reusable components for building CLI tool UIs. Install with the shadcn CLI.
        </p>
      </div>
      {docsNav.map((section, idx) => (
        <div
          key={`${section.section}-${idx}`}
          className="mb-10 sm:mb-12"
        >
          <h2 className="mb-5 text-xl font-semibold sm:mb-6">{section.section}</h2>
          <div className="flex flex-col gap-8 sm:gap-10">
            {section.items.map((item, itemIdx) => {
              const demo = demos[item.name];
              const DemoComponent = demo?.component;
              return (
                <div key={`${item.name}-${itemIdx}`}>
                  <Link
                    to="/docs/$componentName"
                    params={{ componentName: item.name }}
                    preload="intent"
                    className="mb-3 inline-block text-base font-semibold hover:underline sm:text-lg"
                  >
                    {item.title}
                  </Link>
                  {DemoComponent && <DemoComponent />}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
