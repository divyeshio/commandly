import { SkeletonCard } from "@/components/square-card-skeleton";
import { ToolCard } from "@/components/tool-editor-ui/tool-card";
import { Button } from "@/components/ui/button";
import { Input, InputIcon, InputRoot } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { fetchToolsList } from "@/lib/api/tools.api";
import { type Tool } from "@/registry/commandly/lib/types/commandly";
import { queryOptions } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SearchIcon } from "lucide-react";
import React, { Suspense, useEffect, useState } from "react";

export const toolsQueryOptions = () =>
  queryOptions({
    queryKey: ["tools"],
    queryFn: () => fetchToolsList(),
    staleTime: Infinity,
  });

export const Route = createFileRoute("/tools/")({
  component: RouteComponent,
  staleTime: Infinity,
  loader: async () => {
    const serverTools = await fetchToolsList();
    return { serverTools };
  },
});

function RouteComponent() {
  const navigation = useNavigate();
  const loaderData = Route.useLoaderData();
  const [tools, setTools] = useState<Partial<Tool>[]>(loaderData.serverTools || []);
  const [serverToolNames] = useState<Set<string>>(
    new Set((loaderData.serverTools || []).map((t) => t.name).filter((n): n is string => !!n)),
  );

  useEffect(() => {
    const localTools: Partial<Tool>[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("tool-")) {
        try {
          const tool = JSON.parse(localStorage.getItem(key)!) as Partial<Tool>;
          if (tool?.name && !serverToolNames.has(tool.name)) {
            localTools.push(tool);
          }
        } catch {
          // ignore malformed localStorage entries
        }
      }
    }
    if (localTools.length > 0) {
      setTools((prev) => {
        const existingNames = new Set(prev.map((t) => t.name));
        const newTools = localTools.filter((t) => !existingNames.has(t.name));
        return [...newTools, ...prev];
      });
    }
  }, [serverToolNames]);

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

  const handleNewTool = () => {
    navigation({
      to: "/tools/$toolName/edit",
      params: { toolName: "new" },
      search: { isNew: true },
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
      const matchesCategory = filterCategory ? tool.category === filterCategory : true;
      const matchesTag = filterTag
        ? Array.isArray(tool.tags) && tool.tags.includes(filterTag)
        : true;
      return matchesName && matchesCategory && matchesTag;
    });
  }, [tools, searchValue, filterCategory, filterTag]);

  return (
    <SidebarProvider
      className="mt-16 border-t border-muted"
      style={{ height: "calc(100svh - 4rem)", minHeight: "calc(100svh - 4rem)" }}
    >
      <Sidebar collapsible="none">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="flex flex-col gap-6 p-2">
                <div className="flex flex-col gap-2">
                  <Label
                    className="mb-1 block text-sm font-medium"
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
                    className="mb-1 block text-sm font-medium"
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
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="pt-4">
        <div className="flex gap-4 px-4">
          <SidebarTrigger className="md:hidden" />
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
          <div className="flex items-center gap-3">
            <Button
              variant="default"
              className="shadow-sm"
              onClick={handleNewTool}
            >
              New Tool
            </Button>
          </div>
        </div>
        <ScrollArea className="flex *:data-radix-scroll-area-viewport:max-h-[calc(100vh-180px)]">
          <div className="container mx-auto p-6">
            <div className="flex flex-wrap justify-start gap-8">
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
      </SidebarInset>
    </SidebarProvider>
  );
}

function ListComponent({
  tools,
  serverToolNames,
  onDelete,
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
