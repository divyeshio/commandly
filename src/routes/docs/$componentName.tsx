import { DocsCopyPage } from "@/components/docs/docs-copy-page";
import { mdxComponents } from "@/components/docs/mdx-components";
import { createFileRoute, notFound } from "@tanstack/react-router";
import type { ComponentType } from "react";

const GITHUB_RAW_BASE = "https://raw.githubusercontent.com/divyeshio/commandly/refs/heads/main";

/**
 * Imported eagerly, not lazily. These pages are prerendered, so the client hydrates HTML that
 * already contains the page body: the component has to resolve on the client's first render as
 * well, or hydration would render nothing where the static HTML had content.
 */
const docModules = import.meta.glob<{ default: ComponentType<{ components?: object }> }>(
  "./__collection__/*.mdx",
  { eager: true },
);

const docModulePath = (componentName: string) => `./__collection__/${componentName}.mdx`;

export const Route = createFileRoute("/docs/$componentName")({
  component: RouteComponent,
  loader: ({ params: { componentName } }) => {
    if (!docModules[docModulePath(componentName)]) throw notFound();
    return { componentName };
  },
  preload: true,
});

function RouteComponent() {
  const { componentName } = Route.useLoaderData();
  const Component = docModules[docModulePath(componentName)]?.default;

  // The loader throws for an unknown page, so this only guards a directly-rendered route.
  if (!Component) return null;

  return (
    <div className="mx-auto w-full max-w-4xl min-w-0 px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <div className="mb-5 flex justify-end sm:mb-6">
        <DocsCopyPage
          sourceUrl={`${GITHUB_RAW_BASE}/src/routes/docs/__collection__/${componentName}.mdx`}
        />
      </div>
      <Component components={mdxComponents} />
    </div>
  );
}
