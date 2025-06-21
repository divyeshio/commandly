import { createFileRoute, Link } from "@tanstack/react-router";
import { InputRoot, InputIcon, Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  queryOptions,
  useMutation,
  useQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { SearchIcon } from "lucide-react";
import { ToolCard } from "@/components/tool-card";
import { Button } from "@/components/ui/button";
import { Suspense, useCallback } from "react";
import { SkeletonCard } from "@/components/square-card-skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAppForm } from "@/components/ui/tanstack-form";
import { ImportDialog } from "@/components/tool-editor-ui/dialogs/import-dialog";
import { UploadIcon } from "lucide-react";
import type { NewTool, Tool } from "@/lib/types/tool-editor";
import { createServerFn } from "@tanstack/react-start";
import { promises as fs } from "fs";
import path from "path";
import React from "react";

export const toolsQueryOptions = () =>
  queryOptions({
    queryKey: ["tools"],
    queryFn: () => getToolsList(),
    staleTime: Infinity,
  });

const getToolsList = createServerFn({
  method: "GET",
}).handler(async () => {
  const collectionDir = path.join(process.cwd(), "tools-collection");
  const files = await fs.readdir(collectionDir);
  return files.map((file) => {
    return {
      name: file.replace(/\.json$/, ""),
      displayName: file.replace(/\.json$/, ""),
      supportedInput: [],
      supportedOutput: [],
    } as Partial<Tool>;
  });
});

export const Route = createFileRoute("/tools/")({
  component: RouteComponent,
  loader: async ({ context: { queryClient } }) => {
    queryClient.prefetchQuery(toolsQueryOptions());
  },
});

function RouteComponent() {
  const handleImportData = (importedTool: Tool) => {
    console.log("Imported tool:", importedTool);
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
          <ImportDialog onImportData={handleImportData}>
            <Button variant="outline">
              <UploadIcon className="h-4 w-4 mr-2" />
              Import / AI
            </Button>
          </ImportDialog>
          <NewToolDialog>
            <Button variant="default">New Tool</Button>{" "}
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
              <ListComponent />
            </Suspense>
            <ScrollBar orientation="vertical" />
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

function ListComponent() {
  const { data: tools } = useSuspenseQuery(toolsQueryOptions());
  return (
    <React.Fragment>
      {tools.map((tool, index) => (
        <Link
          to="/tools/$toolName"
          params={{ toolName: tool.name! }}
          key={index}
        >
          <ToolCard tool={tool} />
        </Link>
      ))}
    </React.Fragment>
  );
}

function NewToolDialog({ children }: { children: React.ReactNode }) {
  const form = useAppForm({
    defaultValues: {
      name: "",
      displayName: "",
      description: "",
      version: "",
    },
    onSubmit: async ({ value }) => {
      const createdTool = await mutation.mutateAsync(value);
      console.log(createdTool);
    },
  });

  const mutation = useMutation({
    mutationFn: async (newTool: NewTool) => {},
  });

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      form.handleSubmit();
    },
    [form]
  );

  const query = useQuery(toolsQueryOptions());

  return (
    <Dialog onOpenChange={() => form.reset()}>
      <DialogTrigger asChild>
        <div>{children}</div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Tool</DialogTitle>
          <DialogDescription />
        </DialogHeader>
        <form.AppForm>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="space-y-4 ">
              <div className="grid grid-cols-2 gap-4">
                <form.AppField
                  name="name"
                  validators={{
                    onChange: ({ value }) =>
                      !value
                        ? "Name is required"
                        : query.data?.map((t) => t.name).includes(value)
                          ? "Already exists!"
                          : undefined,
                  }}
                  children={(field) => (
                    <field.FormItem>
                      <div className="flex flex-col gap-3">
                        <field.FormLabel htmlFor="tool-name-full">
                          Tool Name
                        </field.FormLabel>
                        <field.FormControl>
                          <Input
                            required
                            id="tool-name-full"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                          />
                        </field.FormControl>
                        <field.FormMessage />
                      </div>
                    </field.FormItem>
                  )}
                />
                <form.AppField
                  name="version"
                  children={(field) => (
                    <field.FormItem>
                      <div className="flex flex-col gap-3">
                        <field.FormLabel htmlFor="tool-version-full">
                          Version
                        </field.FormLabel>
                        <field.FormControl>
                          <Input
                            id="tool-version-full"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                          />
                        </field.FormControl>
                      </div>
                    </field.FormItem>
                  )}
                />
              </div>
              <form.AppField
                name="displayName"
                validators={{
                  onChange: ({ value }) =>
                    !value ? "Display Name is required" : undefined,
                }}
                children={(field) => (
                  <field.FormItem>
                    <div className="flex flex-col gap-3">
                      <field.FormLabel htmlFor="tool-display-name">
                        Display Name
                      </field.FormLabel>
                      <field.FormControl>
                        <Input
                          required
                          id="tool-display-name"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                        />
                      </field.FormControl>
                      <field.FormMessage />
                    </div>
                  </field.FormItem>
                )}
              />
              <form.AppField
                name="description"
                children={(field) => (
                  <field.FormItem>
                    <div className="flex flex-col gap-3">
                      <field.FormLabel htmlFor="tool-description">
                        Description
                      </field.FormLabel>
                      <field.FormControl>
                        <Textarea
                          id="tool-description"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          rows={3}
                        />
                      </field.FormControl>
                    </div>
                  </field.FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit">Create</Button>
            </DialogFooter>
          </form>
        </form.AppForm>
      </DialogContent>
    </Dialog>
  );
}
