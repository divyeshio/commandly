import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface ComponentPreviewTabsProps {
  preview: React.ReactNode;
  code: React.ReactNode;
  className?: string;
}

export function ComponentPreviewTabs({ preview, code, className }: ComponentPreviewTabsProps) {
  return (
    <div className={cn("mb-8", className)}>
      <Tabs defaultValue="preview">
        <TabsList>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
        </TabsList>
        <TabsContent value="preview">
          <div className="flex min-h-87.5 items-center justify-center rounded-lg border p-10">
            {preview}
          </div>
        </TabsContent>
        <TabsContent value="code">
          <div className="max-h-[400px] overflow-y-auto rounded-lg border bg-muted/30">{code}</div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
