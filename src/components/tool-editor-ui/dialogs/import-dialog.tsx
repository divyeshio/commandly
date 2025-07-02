import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { UploadIcon, Loader2Icon, FileTextIcon, Wand2Icon } from "lucide-react";
import { Tool } from "@/lib/types/tool-editor";
import { flattenImportedData, defaultTool } from "@/lib/utils/tool-editor";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ImportDialogProps {
  onImportData: (tool: Tool) => void;
  children: React.ReactNode;
}

export function ImportDialog({ onImportData, children }: ImportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [jsonInput, setJsonInput] = useState("");

  const importFromJSON = () => {
    if (!jsonInput.trim()) {
      return;
    }
    setIsImporting(true);
    try {
      const importedData = JSON.parse(jsonInput);
      const data = flattenImportedData(importedData);
      onImportData(data);
      setJsonInput("");
      setIsOpen(false);
    } catch (error) {
      console.error(error);
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="min-w-fit">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UploadIcon className="h-5 w-5" />
            Import Tool
          </DialogTitle>
        </DialogHeader>
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
              <Button variant="outline" size="sm">
                <FileTextIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="json-input">Or Paste JSON</Label>
            <ScrollArea className="box-border w-full rounded-lg border border-input bg-background ring-offset-background focus-within:ring-1 focus-within:ring-ring min-h-[60dvh] min-w-2xl max-h-[75dvh]">
              <Textarea
                className="min-h-[60dvh] min-w-2xl max-h-[75dvh]"
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
              disabled={isImporting}
              className="flex-1"
            >
              {isImporting ? (
                <>
                  <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <UploadIcon className="h-4 w-4 mr-2" />
                  Import Tool
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
