import { ScrollArea } from "../ui/scroll-area";
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
          <ScrollArea className="rounded-lg border">{code}</ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
