import { mdxComponents } from "@/components/docs/mdx-components";
import { fetchDocComponent } from "@/lib/api/docs.api";
import { createFileRoute } from "@tanstack/react-router";
import { ComponentType, lazy } from "react";

const componentCache = new Map<string, ComponentType<{ components?: object }>>();
const docModules = import.meta.glob<{
  default: ComponentType<{ components?: object }>;
}>("./__collection__/*.mdx");

const MissingDocumentation: ComponentType<{ components?: object }> = () => {
  return <div>Documentation not found</div>;
};

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
  let Component = componentCache.get(componentName);

  if (!Component) {
    Component = lazy(async () => {
      const moduleLoader = docModules[`./__collection__/${componentName}.mdx`];

      if (!moduleLoader) {
        return { default: MissingDocumentation };
      }

      return moduleLoader();
    });
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Component components={mdxComponents} />
    </div>
  );
}
