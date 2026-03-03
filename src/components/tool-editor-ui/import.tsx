import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Tool, ToolSchema } from "@/registry/commandly/lib/types/commandly";
import { FileTextIcon, Loader2Icon, UploadIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function ImportJSON({
  onParseCompleted,
}: {
  onParseCompleted: (tool: Tool | null) => void;
}) {
  const [isImporting, setIsImporting] = useState(false);
  const [jsonInput, setJsonInput] = useState("");

  useEffect(() => onParseCompleted(null), [onParseCompleted]);

  const importFromJSON = () => {
    if (!jsonInput.trim()) {
      return;
    }
    setIsImporting(true);
    try {
      const importedData = JSON.parse(jsonInput);
      const tool = ToolSchema.parse(importedData);
      onParseCompleted(tool);
      setJsonInput("");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.name : "Error", {
        description: "Failed to parse JSON. Please check the format.",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setJsonInput(content);
    };
    reader.readAsText(file);
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <Label htmlFor="file-upload">Upload JSON File</Label>
        <div className="flex items-center gap-2">
          <Input
            id="file-upload"
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="flex-1"
          />
          <Button
            variant="outline"
            size="sm"
          >
            <FileTextIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <Label htmlFor="json-input">Or Paste JSON</Label>
        <ScrollArea className="box-border max-h-[75dvh] min-h-[60dvh] w-full min-w-2xl rounded-lg border border-input bg-background ring-offset-background focus-within:ring-1 focus-within:ring-ring">
          <Textarea
            className="max-h-[75dvh] min-h-[60dvh] min-w-2xl"
            id="json-input"
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder="Paste your Configuration JSON here..."
            rows={50}
          />
        </ScrollArea>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={importFromJSON}
          disabled={isImporting || !jsonInput.trim()}
          className="flex-1"
        >
          {isImporting ? (
            <>
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <UploadIcon className="mr-2 h-4 w-4" />
              Import Tool
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
