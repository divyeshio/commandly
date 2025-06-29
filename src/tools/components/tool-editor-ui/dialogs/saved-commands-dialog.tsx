import { Button } from "../../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "../../ui/dialog";
import { SaveIcon, CopyIcon, Trash2Icon } from "lucide-react";
import { useStore } from "@tanstack/react-store";
import {
  toolBuilderStore,
  toolBuilderActions,
  toolBuilderSelectors
} from "../tool-editor.store";
import { toast } from "sonner";

export function SavedCommandsDialog() {
  const isOpen = useStore(
    toolBuilderStore,
    (state) => state.dialogs.savedCommands
  );
  const savedCommands = useStore(toolBuilderStore, (state) =>
    toolBuilderSelectors.getSavedCommandsForCurrentTool(state)
  );

  const handleClose = () => {
    toolBuilderActions.setSavedCommandsDialogOpen(false);
  };

  const copyCommand = (command: string) => {
    navigator.clipboard.writeText(command);
    toast("Command copied!");
  };

  const deleteCommand = (commandId: string) => {
    toolBuilderActions.removeSavedCommand(commandId);
    toast("Command Removed", {
      description: "Saved command has been removed successfully."
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SaveIcon className="h-5 w-5" />
            Saved Commands
          </DialogTitle>
        </DialogHeader>

        {savedCommands.length === 0 ? (
          <div className="text-center py-8">
            <SaveIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No saved commands yet. Generate and save commands to see them
              here.
            </p>
          </div>
        ) : (
          <div className="space-y-4 overflow-y-auto pr-4 max-h-[calc(80vh-8rem)]">
            {savedCommands &&
              savedCommands.length > 0 &&
              savedCommands.map((savedCommand) => (
                <div
                  key={savedCommand.id}
                  className="p-3 border rounded-lg space-y-3"
                >
                  <div className="flex items-center gap-2 justify-end">
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
                  <pre className="bg-muted p-3 rounded font-mono text-sm">
                    {savedCommand.command}
                  </pre>
                </div>
              ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
