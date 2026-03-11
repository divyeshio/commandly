import { mdxComponents } from "@/components/docs/mdx-components";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fetchDocComponent } from "@/lib/api/docs.api";
import { createFileRoute } from "@tanstack/react-router";
import React from "react";

const componentCache = new Map<string, React.ComponentType<{ components?: object }>>();

export const Route = createFileRoute("/docs/$componentName")({
  component: RouteComponent,
  loader: async ({ params: { componentName } }) => {
    const { component } = await fetchDocComponent(componentName);
    componentCache.set(componentName, component);
    return { componentName };
  },
  preload: true,
});

function RouteComponent() {
  const { componentName } = Route.useLoaderData();
  const Component = componentCache.get(componentName);

  if (!Component) {
    return <div>Documentation not found</div>;
  }

  return (
    <ScrollArea className="h-[80vh]">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Component components={mdxComponents} />
      </div>
    </ScrollArea>
  );
}
