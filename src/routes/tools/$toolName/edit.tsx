import ToolEditor from "@/components/tool-editor-ui/tool-editor";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Tool, ToolSchema } from "@/lib/types/tool-editor";
import { defaultTool } from "@/lib/utils/tool-editor";
import { zodValidator } from "@tanstack/zod-adapter";
import z from "zod/v4";
import { useEffect } from "react";
import { fetchToolDetails } from "@/lib/api/tools.api";

const SearchParamsSchema = z.object({
  newTool: z.string().optional()
});

export const Route = createFileRoute("/tools/$toolName/edit")({
  component: RouteComponent,
  validateSearch: zodValidator(SearchParamsSchema),
  loaderDeps: ({ search: { newTool } }) => ({
    newTool
  }),
  loader: async ({ params: { toolName }, deps: { newTool } }) => {
    if (typeof window === "undefined") {
      return null;
    }

    if (newTool) {
      const newToolData = localStorage.getItem(`tool-${newTool}`);
      if (newToolData) {
        const validatedTool = zodValidator(ToolSchema).parse(
          JSON.parse(newToolData)
        );
        return validatedTool;
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
        title: context.loaderData?.displayName ?? context.params.toolName
      }
    ]
  })
});

function RouteComponent() {
  const tool = Route.useLoaderData();

  return (
    <ToolEditor
      tool={tool!}
      onSave={(tool) => {
        localStorage.setItem(`tool-${tool.name}`, JSON.stringify(tool));
      }}
    />
  );
}
