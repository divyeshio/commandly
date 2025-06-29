import { GeneratedCommand } from "@/components/tool-editor-ui/generated-command";
import { RuntimePreview } from "@/components/tool-editor-ui/runtime-preview";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fetchToolDetails } from "@/lib/api/tools.api";
import { Tool, ToolSchema } from "@/lib/types/tool-editor";
import { defaultTool } from "@/lib/utils/tool-editor";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { TerminalIcon } from "lucide-react";
import { useEffect, useState } from "react";
import z from "zod/v4";

const SearchParamsSchema = z.object({
  newTool: z.string().optional()
});

export const Route = createFileRoute("/tools/$toolName/")({
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
  const router = useRouter();
  useEffect(() => {
    router.invalidate({ sync: true });
  }, []);

  const [parameterValues, setParameterValues] = useState({});
  if (!tool) return <div>Tool not found.</div>;

  return (
    <div className="flex gap-4 mt-6 px-4 w-full">
      <Card className="w-2xl max-w-4xl">
        <CardHeader>
          <CardDescription hidden={true}></CardDescription>
          <CardTitle>Runtime Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ScrollArea className="[&>[data-radix-scroll-area-viewport]]:max-h-[calc(100vh-200px)]">
            <div className="p-4">
              <RuntimePreview
                tool={tool}
                parameterValues={parameterValues}
                updateParameterValue={(parameterId, value) =>
                  setParameterValues((prev) => ({
                    ...prev,
                    [parameterId]: value
                  }))
                }
              />
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="w-3xl max-w-full h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TerminalIcon className="h-5 w-5" />
            Generated Command
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <GeneratedCommand tool={tool} parameterValues={parameterValues} />
        </CardContent>
      </Card>
    </div>
  );
}
