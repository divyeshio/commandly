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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Tool, ManualNewTool } from "@/lib/types/tool-editor";
import { defaultTool } from "@/lib/utils/tool-editor";
import { UploadIcon, Wand2Icon } from "lucide-react";
import { useState } from "react";
import { AIParsing } from "../ai-parsing";

export function NewToolDialog({
  handleNavigation,
  children
}: {
  handleNavigation: (tool: Tool) => void;
  children: React.ReactNode;
}) {
  const [tab, setTab] = useState("manual");

  const [manualNewTool, setManualTool] = useState<ManualNewTool>({
    name: "",
    displayName: "",
    description: "",
    version: ""
  });

  const handleInputChange =
    (name: keyof typeof manualNewTool) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      setManualTool((prev) => ({ ...prev, [name]: value }));
    };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="min-w-fit">
        <DialogHeader>
          <DialogTitle>New Tool</DialogTitle>
          <DialogDescription />
        </DialogHeader>
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="manual">
              <UploadIcon className="h-4 w-4 mr-1" /> Manual
            </TabsTrigger>
            <TabsTrigger value="ai">
              <Wand2Icon className="h-4 w-4 mr-1" /> Parse Help with AI
            </TabsTrigger>
          </TabsList>
          <TabsContent value="manual">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-3">
                  <Label htmlFor="tool-name-full">Tool Name</Label>
                  <Input
                    required
                    id="tool-name-full"
                    value={manualNewTool.name}
                    onChange={handleInputChange("name")}
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <Label htmlFor="tool-version-full">Version</Label>
                  <Input
                    id="tool-version-full"
                    value={manualNewTool.version}
                    onChange={handleInputChange("version")}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="tool-display-name">Display Name</Label>
                <Input
                  required
                  id="tool-display-name"
                  value={manualNewTool.displayName}
                  onChange={handleInputChange("displayName")}
                />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="tool-description">Description</Label>
                <Textarea
                  id="tool-description"
                  value={manualNewTool.description}
                  onChange={handleInputChange("description")}
                  rows={3}
                />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="ai">
            <AIParsing />
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button
            type="submit"
            disabled={!manualNewTool.name || !manualNewTool.displayName}
            onClick={() =>
              handleNavigation({
                ...defaultTool(manualNewTool.name, manualNewTool.displayName),
                ...manualNewTool
              })
            }
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
