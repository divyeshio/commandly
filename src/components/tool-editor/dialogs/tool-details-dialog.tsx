import { useToolBuilder } from "../tool-editor.context";
import { ToolMetadata } from "@/components/commandly/types/flat";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
import { Textarea } from "@/components/ui/textarea";
import { SupportedToolInputType, SupportedToolOutputType } from "@/lib/types";
import { SettingsIcon } from "lucide-react";

const supportedInputOptions = [
  { value: "StandardInput", label: "Standard Input" },
  { value: "Parameter", label: "Parameter" },
];

const supportedOutputOptions = [
  { value: "StandardOutput", label: "Standard Output" },
  { value: "File", label: "File" },
];

export function ToolDetailsDialog() {
  const { tool, dialogs, setDialogOpen, updateTool } = useToolBuilder();

  const isOpen = dialogs.editTool;
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => setDialogOpen("editTool", open)}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Edit Tool Settings
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="tool-name-full">Tool Name</Label>
              <Input
                id="tool-name-full"
                value={tool.name}
                onChange={(e) => {
                  const newName = e.target.value;
                  const prevName = tool.name;
                  updateTool({
                    name: newName,
                    commands: tool.commands.map((cmd) =>
                      cmd.name === prevName ? { ...cmd, name: newName } : cmd,
                    ),
                  });
                }}
              />
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="tool-display-name">Display Name</Label>
              <Input
                id="tool-display-name"
                value={tool.displayName}
                onChange={(e) => updateTool({ displayName: e.target.value })}
              />
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="tool-version-full">Version</Label>
            <Input
              id="tool-version-full"
              value={tool.info?.version}
              onChange={(e) => updateTool({ info: { ...tool.info, version: e.target.value } })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="tool-name-full">Supported Input</Label>
              <MultiSelect
                options={supportedInputOptions}
                onValueChange={(value) =>
                  updateTool({
                    metadata: {
                      ...tool.metadata,
                      supportedInput: value.map((v) => v as SupportedToolInputType),
                    } as ToolMetadata,
                  })
                }
                defaultValue={tool.metadata?.supportedInput}
                placeholder="Select input types"
                variant="default"
                maxCount={0}
              />
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="tool-display-name">Supported Output</Label>
              <MultiSelect
                options={supportedOutputOptions}
                onValueChange={(value) =>
                  updateTool({
                    metadata: {
                      ...tool.metadata,
                      supportedOutput: value.map((v) => v as SupportedToolOutputType),
                    } as ToolMetadata,
                  })
                }
                defaultValue={tool.metadata?.supportedOutput}
                placeholder="Select output types"
                variant="default"
                maxCount={0}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Label htmlFor="tool-url">URL</Label>
            <Input
              id="tool-url"
              value={tool.info?.url ?? ""}
              onChange={(e) =>
                updateTool({ info: { ...tool.info, url: e.target.value || undefined } })
              }
              placeholder="https://example.com"
            />
          </div>

          <div className="flex flex-col gap-3">
            <Label htmlFor="tool-description">Description</Label>
            <Textarea
              id="tool-description"
              value={tool.info?.description}
              onChange={(e) => updateTool({ info: { ...tool.info, description: e.target.value } })}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setDialogOpen("editTool", false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
