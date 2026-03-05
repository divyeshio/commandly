import { fetchToolDetails } from "@/lib/api/tools.api";
import { Tool } from "@/registry/commandly/lib/types/commandly";
import { defaultTool } from "@/registry/commandly/lib/utils/commandly";
import ToolEditor from "@/registry/commandly/tool-editor/tool-editor";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/tools/$toolName/edit")({
  component: RouteComponent,
  validateSearch: (search) => ({
    newTool: typeof search.newTool === "string" ? search.newTool : undefined,
  }),
  loaderDeps: ({ search: { newTool } }) => ({
    newTool,
  }),
  loader: async ({ params: { toolName }, deps: { newTool } }) => {
    if (newTool) {
      const newToolData = localStorage.getItem(`tool-${newTool}`);
      if (newToolData) {
        return JSON.parse(newToolData) as Tool;
      } else {
        return defaultTool() as Tool;
      }
    } else {
      return await fetchToolDetails(toolName);
    }
  },
  ssr: false,
  head: (context) => ({
    meta: [
      {
        title: context.loaderData?.displayName ?? context.params.toolName,
      },
    ],
  }),
});

function RouteComponent() {
  const tool = Route.useLoaderData();
  const { newTool } = Route.useSearch();

  return (
    <ToolEditor
      tool={tool!}
      isNewTool={!!newTool}
      onSave={(tool) => {
        localStorage.setItem(`tool-${tool.name}`, JSON.stringify(tool));
      }}
    />
  );
}
