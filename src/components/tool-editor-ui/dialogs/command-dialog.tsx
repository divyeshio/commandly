import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Command } from "@/lib/types/tool-editor";
import { TerminalIcon } from "lucide-react";
import { useState } from "react";
import { useStore } from "@tanstack/react-store";
import {
  toolBuilderActions,
  toolBuilderStore,
} from "@/components/tool-editor-ui/tool-editor.store";

interface CommandDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandDialog({ isOpen, onOpenChange }: CommandDialogProps) {
  const command = useStore(toolBuilderStore, (state) => state.editingCommand);
  const toolName = useStore(toolBuilderStore, (state) => state.tool.name);
  const [editCommand, setCommand] = useState<Command>(command!);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TerminalIcon className="h-5 w-5" />
            Edit Command Settings
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="cmd-name">Command Name</Label>
              <Input
                id="cmd-name"
                value={editCommand.name}
                disabled={command!.name == toolName}
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
            <div className="flex items-center space-x-2 pt-6">
              <Switch
                id="default-cmd"
                defaultChecked={editCommand.isDefault}
                disabled={command?.isDefault}
                onCheckedChange={(checked) => {
                  setCommand((prev) => ({
                    ...prev,
                    isDefault: checked,
                  }));
                }}
              />
              <Label htmlFor="default-cmd">Default Command</Label>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Label htmlFor="cmd-desc">Description</Label>
            <Textarea
              id="cmd-desc"
              value={editCommand.description}
              onChange={(e) =>
                setCommand((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              toolBuilderActions.updateCommand(editCommand.id, editCommand);
              onOpenChange(false);
            }}
          >
            Save & Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
