import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { SavedCommand } from "@/registry/commandly/lib/types/commandly";
import {
  toolBuilderActions,
  toolBuilderStore,
} from "@/registry/commandly/tool-editor/tool-editor.store";
import { useStore } from "@tanstack/react-store";
import { SaveIcon, CopyIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

interface SavedCommandsDialogProps {
  savedCommands: SavedCommand[];
  onDeleteCommand: (commandId: string) => void;
}

export function SavedCommandsDialog({ savedCommands, onDeleteCommand }: SavedCommandsDialogProps) {
  const copyCommand = (command: string) => {
    navigator.clipboard.writeText(command);
    toast("Command copied!");
  };

  const deleteCommand = (commandId: string) => {
    onDeleteCommand(commandId);
    toast("Command Removed", {
      description: "Saved command has been removed successfully.",
    });
  };

  const open = useStore(toolBuilderStore, (state) => state.dialogs.savedCommands);

  return (
    <Dialog
      open={open}
      onOpenChange={() => toolBuilderActions.setDialogOpen("savedCommands", false)}
    >
      <DialogContent className="max-h-[80vh] max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SaveIcon className="h-5 w-5" />
            Saved Commands
          </DialogTitle>
        </DialogHeader>

        {savedCommands.length === 0 ? (
          <div className="py-8 text-center">
            <SaveIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              No saved commands yet. Generate and save commands to see them here.
            </p>
          </div>
        ) : (
          <div className="max-h-[calc(80vh-8rem)] space-y-4 overflow-y-auto pr-4">
            {savedCommands &&
              savedCommands.length > 0 &&
              savedCommands.map((savedCommand) => (
                <div
                  key={savedCommand.id}
                  className="space-y-3 rounded-lg border p-3"
                >
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyCommand(savedCommand.command)}
                    >
                      <CopyIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteCommand(savedCommand.id)}
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  </div>
                  <pre className="rounded bg-muted p-3 font-mono text-sm">
                    {savedCommand.command}
                  </pre>
                </div>
              ))}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => toolBuilderActions.setDialogOpen("savedCommands", false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
