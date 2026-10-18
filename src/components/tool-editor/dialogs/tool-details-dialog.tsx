import { useToolBuilder } from "../tool-editor.context";
import {
  INSTALLATION_METHODS,
  InstallationMethod,
  InstallationSource,
} from "@/components/commandly/types/tool";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { PlusIcon, SettingsIcon, Trash2Icon } from "lucide-react";

export function ToolDetailsDialog() {
  const { tool, dialogs, setDialogOpen, updateTool } = useToolBuilder();

  const sources = tool.installation?.sources ?? [];

  const setSources = (next: InstallationSource[]) =>
    updateTool({ installation: next.length > 0 ? { sources: next } : undefined });

  const updateSource = (key: string, updates: Partial<InstallationSource>) =>
    setSources(sources.map((source) => (source.key === key ? { ...source, ...updates } : source)));

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
                      cmd.displayName === prevName ? { ...cmd, displayName: newName } : cmd,
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

          <Separator />

          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Installation</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setSources([
                  ...sources,
                  {
                    key: `source-${sources.length + 1}`,
                    method: "package_manager",
                    command: "",
                  },
                ])
              }
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              Add source
            </Button>
          </div>

          {sources.length === 0 && (
            <p className="text-sm text-muted-foreground">No installation sources documented.</p>
          )}

          {sources.map((source, index) => (
            <div
              // Identity cannot follow `source.key`, which is edited below: re-keying on every
              // keystroke would remount the row and drop focus from the input.
              key={index}
              className="space-y-3 rounded-lg border p-3"
            >
              <div className="grid grid-cols-[10rem_1fr_auto] gap-2">
                <Select
                  value={source.method}
                  onValueChange={(value) =>
                    updateSource(source.key, { method: value as InstallationMethod })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INSTALLATION_METHODS.map(({ method, label }) => (
                      <SelectItem
                        key={method}
                        value={method}
                      >
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={source.key}
                  onChange={(e) => updateSource(source.key, { key: e.target.value })}
                  placeholder="key"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${source.key}`}
                  onClick={() => setSources(sources.filter((s) => s.key !== source.key))}
                >
                  <Trash2Icon className="h-4 w-4 text-destructive" />
                </Button>
              </div>

              {source.method === "package_manager" && (
                <Input
                  value={source.manager ?? ""}
                  onChange={(e) =>
                    updateSource(source.key, { manager: e.target.value || undefined })
                  }
                  placeholder="Manager, e.g. brew, go, npm"
                />
              )}

              <Textarea
                value={source.command}
                onChange={(e) => updateSource(source.key, { command: e.target.value })}
                placeholder="Install command"
                rows={2}
              />

              <Input
                value={source.url ?? ""}
                onChange={(e) => updateSource(source.key, { url: e.target.value || undefined })}
                placeholder="Documentation URL"
              />

              <Input
                value={source.note ?? ""}
                onChange={(e) => updateSource(source.key, { note: e.target.value || undefined })}
                placeholder="Note"
              />
            </div>
          ))}
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
