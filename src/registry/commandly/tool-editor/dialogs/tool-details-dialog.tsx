import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { SettingsIcon } from "lucide-react";
import { useStore } from "@tanstack/react-store";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  SupportedToolInputType,
  SupportedToolOutputType
} from "@/registry/commandly/lib/types/tool-editor";
import { TagsComponent } from "@/components/tags";
import { toolBuilderActions, toolBuilderStore } from "../tool-editor.store";

const supportedInputOptions = [
  { value: "StandardInput", label: "Standard Input" },
  { value: "Parameter", label: "Parameter" }
];

const supportedOutputOptions = [
  { value: "StandardOutput", label: "Standard Output" },
  { value: "File", label: "File" }
];

export function ToolDetailsDialog() {
  const tool = useStore(toolBuilderStore, (state) => state.tool);

  const isOpen = useStore(toolBuilderStore, (state) => state.dialogs.editTool);
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) =>
        toolBuilderActions.setDialogOpen("editTool", open)
      }
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
                  toolBuilderActions.updateTool({
                    name: newName,
                    commands: tool.commands.map((cmd) =>
                      cmd.name === prevName ? { ...cmd, name: newName } : cmd
                    )
                  });
                }}
              />
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="tool-display-name">Display Name</Label>
              <Input
                id="tool-display-name"
                value={tool.displayName}
                onChange={(e) =>
                  toolBuilderActions.updateTool({ displayName: e.target.value })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="tool-version-full">Version</Label>
              <Input
                id="tool-version-full"
                value={tool.version}
                onChange={(e) =>
                  toolBuilderActions.updateTool({ version: e.target.value })
                }
              />
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="tool-category">Category</Label>
              <Input
                id="tool-category"
                value={tool.category}
                onChange={(e) =>
                  toolBuilderActions.updateTool({ category: e.target.value })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="tool-name-full">Supported Input</Label>
              <MultiSelect
                options={supportedInputOptions}
                onValueChange={(value) =>
                  toolBuilderActions.updateTool({
                    supportedInput: value.map(
                      (v) => v as SupportedToolInputType
                    )
                  })
                }
                defaultValue={tool.supportedInput}
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
                  toolBuilderActions.updateTool({
                    supportedOutput: value.map(
                      (v) => v as SupportedToolOutputType
                    )
                  })
                }
                defaultValue={tool.supportedOutput}
                placeholder="Select output types"
                variant="default"
                maxCount={0}
              />
            </div>
          </div>
          <TagsComponent
            tags={tool.tags || []}
            onOpenChange={(onOpen, tags) => {
              if (!onOpen) {
                toolBuilderActions.updateTool({ tags });
              }
            }}
          />
          <div className="flex flex-col gap-3">
            <Label htmlFor="tool-description">Description</Label>
            <Textarea
              id="tool-description"
              value={tool.description}
              onChange={(e) =>
                toolBuilderActions.updateTool({ description: e.target.value })
              }
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => toolBuilderActions.setDialogOpen("editTool", false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
