import ToolEditor from "@/components/tool-editor-ui/tool-editor";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import path from "path";
import { promises as fs } from "fs";
import { Tool, ToolSchema } from "@/lib/types/tool-editor";
import { defaultTool } from "@/lib/utils/tool-editor";
import { zodValidator } from "@tanstack/zod-adapter";
import z from "zod/v4";
import { useEffect } from "react";

const getToolDetails = createServerFn()
  .validator((data: string) => data)
  .handler(async (ctx) => {
    const collectionDir = path.join(process.cwd(), "tools-collection");
    const toolFilePath = path.join(collectionDir, `${ctx.data}.json`);
    const file = await fs.readFile(toolFilePath, "utf-8");
    if (!file) {
      throw new Error(`Tool ${ctx.data} not found`);
    }
    return JSON.parse(file) as Tool;
  });

const SearchParamsSchema = z.object({
  newTool: z.string().optional()
});

export const Route = createFileRoute("/tools/$toolName")({
  component: RouteComponent,
  validateSearch: zodValidator(SearchParamsSchema),
  loaderDeps: ({ search: { newTool } }) => ({
    newTool
  }),
  loader: async ({ params: { toolName }, deps: { newTool } }) => {
    // check if executed not in browser context
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
      return await getToolDetails({ data: toolName });
    }
  },
  ssr: false,
  pendingMinMs: 0,
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

  const router = useRouter();
  useEffect(() => {
    router.invalidate({ sync: true });
  }, []);
  if (!tool) return <div>Tool not found.</div>;

  return (
    <ToolEditor
      tool={tool!}
      onSave={(tool) => {
        localStorage.setItem(`tool-${tool.name}`, JSON.stringify(tool));
      }}
    />
  );
}
