import { useToolBuilder } from "../tool-editor.context";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { SettingsIcon } from "lucide-react";

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
              <Label htmlFor="binary-name-full">Binary Name</Label>
              <Input
                id="binary-name-full"
                value={tool.binaryName}
                onChange={(e) => {
                  const newName = e.target.value;
                  const prevName = tool.binaryName;
                  updateTool({
                    binaryName: newName,
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
          <div className="flex items-center space-x-2">
            <Switch
              id="tool-interactive"
              checked={tool.interactive ?? false}
              onCheckedChange={(checked) => updateTool({ interactive: checked })}
            />
            <Label htmlFor="tool-interactive">Interactive</Label>
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
