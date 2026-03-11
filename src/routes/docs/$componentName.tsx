import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchRegistryItem, type RegistryItem } from "@/lib/api/registry.api";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CopyIcon, CheckIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/docs/$componentName")({
  component: RouteComponent,
  loader: async ({ params }) => {
    const item = await fetchRegistryItem(params.componentName);
    return { item };
  },
});

function typeBadgeVariant(type: string): "default" | "secondary" | "outline" {
  if (type === "registry:block") return "default";
  if (type === "registry:component") return "secondary";
  return "outline";
}

function typeLabel(type: string): string {
  return type.replace("registry:", "");
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(text);
    toast("Copied to clipboard");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={copy}
      className="h-7 w-7 shrink-0"
    >
      {copied ? <CheckIcon className="h-3.5 w-3.5" /> : <CopyIcon className="h-3.5 w-3.5" />}
    </Button>
  );
}

function fileTabLabel(path: string): string {
  return path.split("/").pop() ?? path;
}

function ComponentDetail({ item }: { item: RegistryItem }) {
  const installCmd = `npx shadcn@latest add https://commandly.divyeshio.in/r/${item.name}.json`;
  const filesWithContent = item.files.filter((f) => f.content);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight">{item.title ?? item.name}</h1>
        <Badge variant={typeBadgeVariant(item.type)}>{typeLabel(item.type)}</Badge>
      </div>

      {item.description && <p className="text-muted-foreground">{item.description}</p>}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Installation</h2>
        <div className="flex items-center gap-2 rounded-lg border bg-muted px-4 py-3">
          <code className="flex-1 font-mono text-sm break-all">{installCmd}</code>
          <CopyButton text={installCmd} />
        </div>
      </section>

      {((item.dependencies?.length ?? 0) > 0 || (item.registryDependencies?.length ?? 0) > 0) && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Dependencies</h2>
          <div className="flex flex-col gap-2">
            {(item.dependencies?.length ?? 0) > 0 && (
              <div>
                <p className="mb-1.5 text-sm text-muted-foreground">npm packages</p>
                <div className="flex flex-wrap gap-2">
                  {item.dependencies!.map((dep) => (
                    <Badge
                      key={dep}
                      variant="secondary"
                    >
                      {dep}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {(item.registryDependencies?.length ?? 0) > 0 && (
              <div>
                <p className="mb-1.5 text-sm text-muted-foreground">shadcn components</p>
                <div className="flex flex-wrap gap-2">
                  {item.registryDependencies!.map((dep) => (
                    <Badge
                      key={dep}
                      variant="outline"
                    >
                      {dep}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {filesWithContent.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Files</h2>
          <Tabs defaultValue={filesWithContent[0].path}>
            <ScrollArea>
              <TabsList className="w-max">
                {filesWithContent.map((file) => (
                  <TabsTrigger
                    key={file.path}
                    value={file.path}
                    className="text-xs"
                  >
                    {fileTabLabel(file.path)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </ScrollArea>
            {filesWithContent.map((file) => (
              <TabsContent
                key={file.path}
                value={file.path}
              >
                <div className="relative">
                  <div className="absolute top-3 right-3 z-10">
                    <CopyButton text={file.content!} />
                  </div>
                  <ScrollArea className="h-125 rounded-lg border bg-muted">
                    <pre className="p-4 font-mono text-xs whitespace-pre">{file.content}</pre>
                  </ScrollArea>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </section>
      )}
    </div>
  );
}

function RouteComponent() {
  const { item } = Route.useLoaderData();

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <Link
        to="/docs"
        className="mb-8 inline-flex items-center text-sm text-muted-foreground hover:text-foreground hover:underline"
      >
        ← Back to components
      </Link>
      <ComponentDetail item={item} />
    </div>
  );
}
