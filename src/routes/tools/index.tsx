import { type Tool } from "@/components/commandly/types/flat";
import { slugify } from "@/components/commandly/utils/flat";
import { SkeletonCard } from "@/components/square-card-skeleton";
import { ToolCard } from "@/components/tool-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { fetchToolsList } from "@/lib/api/tools.api";
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
    new Set(
      (loaderData.serverTools || []).map((t) => t.binaryName).filter((n): n is string => !!n),
    ),
  );

  useEffect(() => {
    const localTools: Partial<Tool>[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("tool-")) {
        try {
          const tool = JSON.parse(localStorage.getItem(key)!) as Partial<Tool>;
          if (tool?.binaryName && !serverToolNames.has(tool.binaryName)) {
            localTools.push(tool);
          }
        } catch {
          // ignore malformed localStorage entries
        }
      }
    }
    if (localTools.length > 0) {
      setTools((prev) => {
        const existingNames = new Set(prev.map((t) => t.binaryName));
        const newTools = localTools.filter((t) => !existingNames.has(t.binaryName));
        return [...newTools, ...prev];
      });
    }
  }, [serverToolNames]);

  const [searchValue, setSearchValue] = useState("");
  const [newToolDialogOpen, setNewToolDialogOpen] = useState(false);
  const [newToolName, setNewToolName] = useState("");
  const [newToolDisplayName, setNewToolDisplayName] = useState("");
  const [displayNameEdited, setDisplayNameEdited] = useState(false);

  const handleNewTool = () => {
    setNewToolName("");
    setNewToolDisplayName("");
    setDisplayNameEdited(false);
    setNewToolDialogOpen(true);
  };

  const handleNewToolNameChange = (value: string) => {
    setNewToolName(value);
    if (!displayNameEdited) {
      setNewToolDisplayName(value.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()));
    }
  };

  const handleCreateTool = () => {
    const name = slugify(newToolName.trim());
    const displayName = newToolDisplayName.trim() || newToolName.trim();
    const newTool: Tool = { binaryName: name, displayName, commands: [], parameters: [] };
    localStorage.setItem(`tool-${name}`, JSON.stringify(newTool));
    setNewToolDialogOpen(false);
    navigation({
      to: "/tools/$toolName/edit",
      params: { toolName: name },
      search: { isLocal: true },
    });
  };

  const handleDelete = (tool: Partial<Tool>) => {
    localStorage.removeItem(`tool-${tool.binaryName}`);
    setTools((prev) => prev.filter((t) => t.binaryName !== tool.binaryName));
  };

  const filteredTools = React.useMemo(() => {
    return tools.filter((tool) => {
      const matchesName = searchValue
        ? tool.binaryName?.toLowerCase().includes(searchValue.toLowerCase()) ||
          tool.displayName?.toLowerCase().includes(searchValue.toLowerCase())
        : true;
      return matchesName;
    });
  }, [tools, searchValue]);

  return (
    <SidebarProvider
      className="mt-16 border-t border-muted"
      style={{ height: "calc(100svh - 4rem)", minHeight: "calc(100svh - 4rem)" }}
    >
      <SidebarInset className="pt-4">
        <div className="flex gap-4 px-4">
          <SidebarTrigger className="md:hidden" />
          <InputGroup className="h-9 w-full shadow-sm">
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search tools..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </InputGroup>
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
        <Dialog
          open={newToolDialogOpen}
          onOpenChange={setNewToolDialogOpen}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>New Tool</DialogTitle>
              <DialogDescription>Enter details for your new CLI tool definition.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="new-tool-name">Binary Name</Label>
                <Input
                  id="new-tool-name"
                  value={newToolName}
                  autoFocus
                  onChange={(e) => handleNewToolNameChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newToolName.trim()) handleCreateTool();
                  }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="new-tool-display-name">Display Name</Label>
                <Input
                  id="new-tool-display-name"
                  value={newToolDisplayName}
                  onChange={(e) => {
                    setNewToolDisplayName(e.target.value);
                    setDisplayNameEdited(true);
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setNewToolDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                disabled={!newToolName.trim()}
                onClick={handleCreateTool}
              >
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <ScrollArea className="flex *:data-radix-scroll-area-viewport:max-h-[calc(100vh-117px)]">
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
            key={tool.binaryName || index}
            tool={tool}
            isLocal={!serverToolNames.has(tool.binaryName!)}
            onDelete={onDelete}
          />
        );
      })}
    </React.Fragment>
  );
}
