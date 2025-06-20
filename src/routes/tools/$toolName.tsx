import ToolEditor from "@/components/tool-editor-ui/tool-editor";
import { queryOptions } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

const fetchGlobalToolDetailsQueryOptions = (toolName: string) =>
  queryOptions({
    queryKey: ["tools", toolName],
    queryFn: async () => {
      return await fetch("/api/tools/" + toolName).then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch tool details for ${toolName}`);
        }
        return res.json();
      });
    },
    staleTime: Infinity,
  });

export const Route = createFileRoute("/tools/$toolName")({
  component: RouteComponent,
  loader: async ({ context: { queryClient }, params: { toolName } }) => {
    const data = await queryClient.fetchQuery(
      fetchGlobalToolDetailsQueryOptions(toolName)
    );
    return data;
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
