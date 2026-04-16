import { DocsCopyPage } from "@/components/docs/docs-copy-page";
import { mdxComponents } from "@/components/docs/mdx-components";
import { createFileRoute } from "@tanstack/react-router";
import { ComponentType, lazy } from "react";

const GITHUB_RAW_BASE = "https://raw.githubusercontent.com/divyeshio/commandly/refs/heads/main";

const componentCache = new Map<string, ComponentType<{ components?: object }>>();
const rawCache = new Map<string, string>();
const docModules = import.meta.glob<{
  default: ComponentType<{ components?: object }>;
}>("./__collection__/*.mdx");
const rawDocModules = import.meta.glob<string>("./__collection__/*.mdx", {
  query: "?raw",
  import: "default",
});

const MissingDocumentation: ComponentType<{ components?: object }> = () => {
  return <div>Documentation not found</div>;
};

export const Route = createFileRoute("/docs/$componentName")({
  component: RouteComponent,
  loader: async ({ params: { componentName } }) => {
    const moduleLoader = docModules[`./__collection__/${componentName}.mdx`];
    const rawLoader = rawDocModules[`./__collection__/${componentName}.mdx`];

    if (!moduleLoader || !rawLoader) {
      throw new Error(`Documentation not found for "${componentName}"`);
    }

    const module = await moduleLoader();
    const raw = await rawLoader();
    const component = module.default;

    componentCache.set(componentName, component);
    rawCache.set(componentName, raw);
    return { componentName };
  },
  preload: true,
});

function RouteComponent() {
  const { componentName } = Route.useLoaderData();
  let Component = componentCache.get(componentName);
  const raw = rawCache.get(componentName) ?? "";

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
    <div className="mx-auto w-full max-w-4xl min-w-0 px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <div className="mb-5 flex justify-end sm:mb-6">
        <DocsCopyPage
          page={raw}
          sourceUrl={`${GITHUB_RAW_BASE}/src/routes/docs/__collection__/${componentName}.mdx`}
        />
      </div>
      <Component components={mdxComponents} />
    </div>
  );
}
