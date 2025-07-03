import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tool } from "@/lib/types/tool-editor";
import { Edit2Icon, UploadIcon, Wand2Icon } from "lucide-react";
import { useState } from "react";
import { AIParsing } from "../ai-parsing";
import { ManualNewToolComponent } from "../manual-new-tool";
import { ImportJSON } from "../import";

export function NewToolDialog({
  handleNavigation,
  children
}: {
  handleNavigation: (tool: Tool) => void;
  children: React.ReactNode;
}) {
  const [tab, setTab] = useState("manual");

  const [aiParsedTool, setAIParsedTool] = useState<Tool | null>(null);
  const [importedTool, setImportedTool] = useState<Tool | null>(null);
  const [manualTool, setManualTool] = useState<Tool | null>(null);

  const canSubmit = () => {
    if (tab === "manual") {
      return manualTool?.name && manualTool?.displayName ? true : false;
    }
    if (tab === "import") {
      return importedTool ? true : false;
    }
    if (tab === "ai") {
      return aiParsedTool ? true : false;
    }
  };

  const onSubmit = () => {
    if (tab === "manual") {
      handleNavigation(manualTool!);
    }
    if (tab === "import") {
      handleNavigation(importedTool!);
    }
    if (tab === "ai") {
      console.log("AI Parsed Tool");
      handleNavigation(aiParsedTool!);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="min-h-[95dvh] w-2xl min-w-fit">
        <DialogHeader>
          <DialogTitle>New Tool</DialogTitle>
          <DialogDescription />
        </DialogHeader>
        <Tabs
          value={tab}
          onValueChange={(tab) => setTab(tab)}
          className="w-full"
        >
          <TabsList className="w-full">
            <TabsTrigger value="import">
              <UploadIcon className="h-4 w-4 mr-1" /> Import JSON
            </TabsTrigger>
            <TabsTrigger value="manual">
              <Edit2Icon className="h-4 w-4 mr-1" /> Manual
            </TabsTrigger>
            <TabsTrigger value="ai">
              <Wand2Icon className="h-4 w-4 mr-1" /> Parse Help with AI
            </TabsTrigger>
          </TabsList>
          <TabsContent value="import">
            <ImportJSON onParseCompleted={setImportedTool} />
          </TabsContent>
          <TabsContent value="manual">
            <ManualNewToolComponent onSubmit={setManualTool} />
          </TabsContent>
          <TabsContent value="ai">
            <AIParsing onParseCompleted={setAIParsedTool} />
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button
            type="submit"
            disabled={!canSubmit()}
            onClick={() => onSubmit()}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
