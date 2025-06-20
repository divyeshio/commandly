import { fetchGlobalToolDetails } from "@/lib/api/tools.api";
import ToolEditor from "@/components/tool-editor-ui/tool-editor";
import { queryOptions } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

const fetchGlobalToolDetailsQueryOptions = (toolName: string) =>
  queryOptions({
    queryKey: ["tools", toolName],
    queryFn: () => fetchGlobalToolDetails(toolName),
    staleTime: Infinity,
  });

export const Route = createFileRoute("/tools/$toolName")({
  component: RouteComponent,
  loader: async ({ context: { queryClient }, params: { toolName } }) => {
    return await queryClient.fetchQuery(
      fetchGlobalToolDetailsQueryOptions(toolName)
    );
  },
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
