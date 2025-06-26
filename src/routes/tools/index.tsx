import React, { Suspense, useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions } from "@tanstack/react-query";
import { SearchIcon } from "lucide-react";
import { ToolCard } from "@/components/tool-card";
import { Button } from "@/components/ui/button";
import { SkeletonCard } from "@/components/square-card-skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input, InputIcon, InputRoot } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { UploadIcon } from "lucide-react";
import type { NewTool, Tool } from "@/lib/types/tool-editor";
import { createServerFn } from "@tanstack/react-start";
import { promises as fs } from "fs";
import path from "path";
import { ImportDialog } from "@/components/tool-editor-ui/dialogs/import-dialog";
import { defaultTool } from "@/lib/utils/tool-editor";

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
  return files.map((file) => {
    return {
      name: file.replace(/\.json$/, ""),
      displayName: file.replace(/\.json$/, ""),
      supportedInput: [],
      supportedOutput: []
    } as Partial<Tool>;
  });
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
  ssr: true,
  loader: async ({ context: { queryClient } }) => {
    const serverTools = await queryClient.fetchQuery(toolsQueryOptions());
    const localTools = loadLocalTools();
    return { localTools, serverTools };
  }
});

function RouteComponent() {
  const navigation = useNavigate({ from: "/tools" });
  const loaderData = Route.useLoaderData();
  const [tools, setTools] = useState<Partial<Tool>[]>(loaderData.localTools);
  const [serverToolNames, setServerToolNames] = useState<Set<string>>(
    new Set((loaderData.serverTools || []).map((t: any) => t.name))
  );

  // On client, keep tools in sync with localStorage
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
    localStorage.setItem(
      `tool-${importedTool.name}`,
      JSON.stringify(importedTool)
    );
    navigation({
      to: "/tools/$toolName",
      params: { toolName: importedTool.name },
      search: { newTool: importedTool.name }
    });
  };

  return (
    <div>
      <div className="flex gap-4 px-4">
        <InputRoot className="w-full">
          <InputIcon>
            <SearchIcon />
          </InputIcon>
          <Input placeholder="Search tools..." />
        </InputRoot>
        <div className="flex gap-3 items-center">
          <ImportDialog onImportData={handleNavigation}>
            <Button variant="outline">
              <UploadIcon className="h-4 w-4 mr-2" />
              Import / AI
            </Button>
          </ImportDialog>
          <NewToolDialog handleNavigation={handleNavigation}>
            <Button variant="default">New Tool</Button>
          </NewToolDialog>
        </div>
      </div>
      <ScrollArea className="flex [&>[data-radix-scroll-area-viewport]]:max-h-[calc(100vh-180px)]">
        <div className="container mx-auto p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-2">
            <Suspense
              fallback={
                <>
                  {[...Array(8)].map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </>
              }
            >
              <ListComponent tools={tools} serverToolNames={serverToolNames} />
            </Suspense>
            <ScrollBar orientation="vertical" />
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

function ListComponent({
  tools,
  serverToolNames
}: {
  tools: Partial<Tool>[];
  serverToolNames: Set<string>;
}) {
  return (
    <React.Fragment>
      {tools.map((tool: Partial<Tool>, index: number) => {
        const isLocal = !serverToolNames.has(tool.name!);
        return (
          <Link
            to="/tools/$toolName"
            params={{ toolName: tool.name! }}
            key={index}
            {...(isLocal ? { search: { newTool: tool.name } } : {})}
          >
            <ToolCard tool={tool} />
          </Link>
        );
      })}
    </React.Fragment>
  );
}

function NewToolDialog({
  handleNavigation,
  children
}: {
  handleNavigation: (tool: Tool) => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [newTool, setFormData] = useState<NewTool>({
    name: "",
    displayName: "",
    description: "",
    version: ""
  });

  const handleInputChange =
    (name: keyof typeof newTool) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      setFormData((prev) => ({ ...prev, [name]: value }));
    };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div>{children}</div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Tool</DialogTitle>
          <DialogDescription />
        </DialogHeader>
        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex flex-col gap-4"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="tool-name-full">Tool Name</Label>
                <Input
                  required
                  id="tool-name-full"
                  value={newTool.name}
                  onChange={handleInputChange("name")}
                />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="tool-version-full">Version</Label>
                <Input
                  id="tool-version-full"
                  value={newTool.version}
                  onChange={handleInputChange("version")}
                />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="tool-display-name">Display Name</Label>
              <Input
                required
                id="tool-display-name"
                value={newTool.displayName}
                onChange={handleInputChange("displayName")}
              />
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="tool-description">Description</Label>
              <Textarea
                id="tool-description"
                value={newTool.description}
                onChange={handleInputChange("description")}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={!newTool.name || !newTool.displayName}
              onClick={() =>
                handleNavigation({
                  ...defaultTool(newTool.name, newTool.displayName),
                  ...newTool
                })
              }
            >
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
