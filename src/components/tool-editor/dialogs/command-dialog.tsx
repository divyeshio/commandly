import { Command } from "@/components/commandly/types/tool";
import { TagsInput } from "@/components/commandly/ui/tags-input";
import { slugify } from "@/components/commandly/utils/tool";
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
  siblingKeys?: string[];
  toolName: string;
  onSave: (command: Command) => void;
}

export function CommandDialog({
  isOpen,
  onOpenChange,
  command,
  parentKey,
  siblingKeys = [],
  onSave,
}: CommandDialogProps) {
  const isNewCommand = !command;
  const getDefaultCommand = () =>
    command ?? {
      key: "",
      displayName: "",
      description: "",
      sortOrder: 0,
      parameters: [],
    };

  const [editCommand, setCommand] = useState<Command>(getDefaultCommand);

  const derivedKey = slugify(editCommand.displayName);
  /** A command follows its display name until a key is written. */
  const commandKey = editCommand.key || derivedKey;
  const isDuplicate =
    isNewCommand && !!commandKey && (commandKey === parentKey || siblingKeys.includes(commandKey));

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) setCommand(getDefaultCommand());
        onOpenChange(open);
      }}
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
              <Label htmlFor="cmd-display-name">Display Name</Label>
              <Input
                id="cmd-display-name"
                value={editCommand.displayName}
                onChange={(e) =>
                  setCommand((prev) => ({
                    ...prev,
                    displayName: e.target.value,
                  }))
                }
              />
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="cmd-key">Key</Label>
              <Input
                id="cmd-key"
                value={editCommand.key}
                onChange={(e) => setCommand((prev) => ({ ...prev, key: slugify(e.target.value) }))}
                placeholder={derivedKey}
              />
            </div>
          </div>
          {isDuplicate && (
            <p className="text-sm text-destructive">
              A command with this key already exists at this level.
            </p>
          )}
          <div className="flex flex-col gap-3">
            <Label htmlFor="cmd-aliases">Aliases</Label>
            <TagsInput
              value={editCommand.aliases ?? []}
              onValueChange={(aliases) => setCommand((prev) => ({ ...prev, aliases }))}
              placeholder="Add alternate spellings"
            />
          </div>
          <div className="flex items-center space-x-4">
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
            disabled={!editCommand.displayName.trim() || isDuplicate}
            onClick={() => {
              onSave({ ...editCommand, key: commandKey });
              setCommand(getDefaultCommand());
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
