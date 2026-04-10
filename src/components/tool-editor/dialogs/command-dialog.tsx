import { Command } from "@/components/commandly/types/flat";
import { slugify } from "@/components/commandly/utils/flat";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { TerminalIcon } from "lucide-react";
import { useState } from "react";

interface CommandDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  command?: Command;
  parentKey?: string;
  toolName: string;
  onSave: (command: Command) => void;
}

export function CommandDialog({
  isOpen,
  onOpenChange,
  command,
  parentKey,
  toolName,
  onSave,
}: CommandDialogProps) {
  const isNewCommand = !command;
  const [editCommand, setCommand] = useState<Command>(
    () =>
      command ?? {
        key: "",
        name: "",
        description: "",
        isDefault: false,
        sortOrder: 0,
        parentCommandKey: parentKey,
      },
  );

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TerminalIcon className="h-5 w-5" />
            {isNewCommand ? "Add Command" : "Edit Command Settings"}
          </DialogTitle>
          <DialogDescription>Dialog for editing command details</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="cmd-name">Command Name</Label>
              <Input
                id="cmd-name"
                value={editCommand.name}
                disabled={!isNewCommand && command!.name === toolName}
                onChange={(e) =>
                  setCommand((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="sort-order">Sort Order</Label>
              <Input
                id="sort-order"
                type="number"
                value={editCommand.sortOrder}
                onChange={(e) =>
                  setCommand((prev) => ({
                    ...prev,
                    sortOrder: Number.parseInt(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div className="flex items-center space-x-4 pt-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="default-cmd"
                  checked={editCommand.isDefault}
                  disabled={!isNewCommand && command?.isDefault}
                  onCheckedChange={(checked) => {
                    setCommand((prev) => ({
                      ...prev,
                      isDefault: checked,
                    }));
                  }}
                />
                <Label htmlFor="default-cmd">Default Command</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="interactive-cmd"
                  checked={editCommand.interactive ?? false}
                  onCheckedChange={(checked) => {
                    setCommand((prev) => ({
                      ...prev,
                      interactive: checked,
                    }));
                  }}
                />
                <Label htmlFor="interactive-cmd">Interactive</Label>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="cmd-desc">Description</Label>
            <Textarea
              id="cmd-desc"
              value={editCommand.description}
              onChange={(e) => setCommand((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            disabled={isNewCommand && !editCommand.name.trim()}
            onClick={() => {
              const finalCommand = isNewCommand
                ? { ...editCommand, key: slugify(editCommand.name) }
                : editCommand;
              onSave(finalCommand);
              onOpenChange(false);
            }}
          >
            {isNewCommand ? "Add" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
