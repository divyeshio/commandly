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
    <div className={cn("mb-8 overflow-hidden", className)}>
      <Tabs defaultValue="preview">
        <TabsList className="max-w-full justify-start overflow-x-auto whitespace-nowrap">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
        </TabsList>
        <TabsContent value="preview">
          <div className="overflow-hidden rounded-lg border bg-background">
            <div className="flex min-h-48 items-center justify-center p-4 sm:min-h-87.5 sm:p-10">
              <div className="w-full overflow-x-auto">
                <div className="mx-auto flex min-w-fit justify-center">{preview}</div>
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="code">
          <ScrollArea className="w-full rounded-lg border">{code}</ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
