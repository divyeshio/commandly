import React, { Suspense, useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { queryOptions } from "@tanstack/react-query";
import { SearchIcon } from "lucide-react";
import { ToolCard } from "@/components/tool-editor-ui/tool-card";
import { Button } from "@/components/ui/button";
import { SkeletonCard } from "@/components/square-card-skeleton";
import { Input, InputIcon, InputRoot } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { type Tool } from "@/registry/commandly/lib/types/commandly";
import { createServerFn } from "@tanstack/react-start";
import { promises as fs } from "fs";
import path from "path";
import { MultiSelect } from "@/components/ui/multi-select";
import { NewToolDialog } from "@/components/tool-editor-ui/dialogs/new-tool";
import { v7 as uuidv7 } from "uuid";

export const toolsQueryOptions = () =>
  queryOptions({
    queryKey: ["tools"],
    queryFn: () => getToolsList(),
    staleTime: Infinity
  });

const getToolsList = createServerFn({
  method: "GET",
  type: "static"
}).handler(async () => {
  const collectionDir = path.join(process.cwd(), "public", "tools-collection");
  const files = await fs.readdir(collectionDir);
  let tools: Partial<Tool>[] = [];
  files.map(async (file) => {
    const filePath = path.join(collectionDir, file);
    const fileContent = await fs.readFile(filePath, "utf-8").catch(() => null);
    var json = JSON.parse(fileContent || "{}");
    const tool = json as Tool;
    tools.push({
      name: tool.name,
      displayName: tool.displayName || tool.name,
      description: tool.description,
      supportedInput: tool.supportedInput,
      supportedOutput: tool.supportedOutput
    });
  });
  return tools;
});

function loadLocalTools(): Partial<Tool>[] {
  const localTools: Partial<Tool>[] = [];
  if (typeof window !== "undefined") {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("tool-")) {
        try {
          const tool = JSON.parse(localStorage.getItem(key)!);
          if (tool && tool.name && tool.displayName) {
            localTools.push(tool);
          }
        } catch {}
      }
    }
  }
  return localTools;
}

function mergeTools(
  serverTools: Partial<Tool>[],
  localTools: Partial<Tool>[]
): Partial<Tool>[] {
  const serverToolNames = new Set(serverTools.map((t) => t.name));
  return [
    ...serverTools,
    ...localTools.filter((t) => !serverToolNames.has(t.name))
  ];
}

export const Route = createFileRoute("/tools/")({
  component: RouteComponent,
  staleTime: Infinity,
  ssr: true,
  loader: async ({ context: { queryClient } }) => {
    const serverTools = await getToolsList();
    const localTools = loadLocalTools();
    return { localTools, serverTools };
  }
});

function RouteComponent() {
  const navigation = useNavigate();
  const loaderData = Route.useLoaderData();
  const [tools, setTools] = useState<Partial<Tool>[]>(loaderData.localTools);
  const [serverToolNames, setServerToolNames] = useState<Set<string>>(
    new Set((loaderData.serverTools || []).map((t: any) => t.name))
  );

  const [searchValue, setSearchValue] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterTag, setFilterTag] = useState("");

  const categories = React.useMemo(() => {
    const set = new Set<string>();
    tools.forEach((tool) => {
      if (tool.category) set.add(tool.category);
    });
    return Array.from(set);
  }, [tools]);

  const tags = React.useMemo(() => {
    const set = new Set<string>();
    tools.forEach((tool) => {
      if (Array.isArray(tool.tags)) {
        tool.tags.forEach((tag: string) => set.add(tag));
      }
    });
    return Array.from(set);
  }, [tools]);

  useEffect(() => {
    const localTools = loadLocalTools();
    const serverToolNamesSet = new Set(
      (loaderData.serverTools || []).map((t: any) => t.name)
    );
    setServerToolNames(serverToolNamesSet);
    const mergedTools = mergeTools(loaderData.serverTools || [], localTools);
    setTools(mergedTools);
  }, [loaderData.serverTools]);

  const handleNavigation = (importedTool: Tool) => {
    importedTool.id = uuidv7();
    localStorage.setItem(
      `tool-${importedTool.name}`,
      JSON.stringify(importedTool)
    );
    navigation({
      to: "/tools/$toolName/edit",
      params: { toolName: importedTool.name },
      search: { newTool: importedTool.name }
    });
  };

  const handleDelete = (tool: Partial<Tool>) => {
    localStorage.removeItem(`tool-${tool.name}`);
    setTools((prev) => prev.filter((t) => t.name !== tool.name));
  };

  const filteredTools = React.useMemo(() => {
    return tools.filter((tool) => {
      const matchesName = searchValue
        ? tool.name?.toLowerCase().includes(searchValue.toLowerCase()) ||
          tool.displayName?.toLowerCase().includes(searchValue.toLowerCase())
        : true;
      const matchesCategory = filterCategory
        ? tool.category === filterCategory
        : true;
      const matchesTag = filterTag
        ? Array.isArray(tool.tags) && tool.tags.includes(filterTag)
        : true;
      return matchesName && matchesCategory && matchesTag;
    });
  }, [tools, searchValue, filterCategory, filterTag]);

  return (
    <div className="flex border-t border-muted">
      <aside className="w-64 min-w-[200px] h-screen max-w-xs p-4 border-r-2 border-muted">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label
              className="block text-sm font-medium mb-1"
              htmlFor="filter-category"
            >
              Category
            </Label>
            <MultiSelect
              options={categories.map((cat) => ({ value: cat, label: cat }))}
              onValueChange={function (value: string[]): void {
                setFilterCategory(value[0]);
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label
              className="block text-sm font-medium mb-1"
              htmlFor="filter-tag"
            >
              Tag
            </Label>
            <MultiSelect
              options={tags.map((tag) => ({ value: tag, label: tag }))}
              onValueChange={function (value: string[]): void {
                setFilterTag(value[0]);
              }}
            />
          </div>
        </div>
      </aside>
      <div className="flex-1 pt-4">
        <div className="flex gap-4 px-4">
          <InputRoot className="w-full">
            <InputIcon>
              <SearchIcon />
            </InputIcon>
            <Input
              className="shadow-md"
              placeholder="Search tools..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </InputRoot>
          <div className="flex gap-3 items-center">
            <NewToolDialog handleNavigation={handleNavigation}>
              <Button variant="default" className="shadow-sm">
                New Tool
              </Button>
            </NewToolDialog>
          </div>
        </div>
        <ScrollArea className="flex [&>[data-radix-scroll-area-viewport]]:max-h-[calc(100vh-180px)]">
          <div className="container mx-auto p-6">
            <div className="flex gap-8 flex-wrap justify-start">
              <Suspense
                fallback={
                  <>
                    {[...Array(8)].map((_, i) => (
                      <SkeletonCard key={i} />
                    ))}
                  </>
                }
              >
                <ListComponent
                  tools={filteredTools}
                  serverToolNames={serverToolNames}
                  onDelete={handleDelete}
                />
              </Suspense>
              <ScrollBar orientation="vertical" />
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

function ListComponent({
  tools,
  serverToolNames,
  onDelete
}: {
  tools: Partial<Tool>[];
  serverToolNames: Set<string>;
  onDelete: (tool: Partial<Tool>) => void;
}) {
  return (
    <React.Fragment>
      {tools.map((tool: Partial<Tool>, index: number) => {
        return (
          <ToolCard
            key={tool.name || index}
            tool={tool}
            isLocal={!serverToolNames.has(tool.name!)}
            onDelete={onDelete}
          />
        );
      })}
    </React.Fragment>
  );
}
