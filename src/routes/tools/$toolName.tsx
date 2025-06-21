import ToolEditor from "@/components/tool-editor-ui/tool-editor";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import path from "path";
import { promises as fs } from "fs";
import { Tool } from "@/lib/types/tool-editor";

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

export const Route = createFileRoute("/tools/$toolName")({
  component: RouteComponent,
  loader: async ({ params: { toolName } }) => {
    return getToolDetails({ data: toolName });
  },
  ssr: false,
  pendingMinMs: 0,
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

  return <ToolEditor tool={tool} />;
}
