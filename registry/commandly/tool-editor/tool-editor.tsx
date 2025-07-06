import { SavedCommand, Tool } from "@/registry/commandly/lib/types/commandly";
import { CommandTree } from "./command-tree";
import { ParameterList } from "./parameter-list";
import { ParameterDetailsDialog } from "../tool-editor/dialogs/parameter-details-dialog";
import { ExclusionGroupsDialog } from "../tool-editor/dialogs/exclusion-groups-dialog";
import { PreviewTabs } from "./preview-tabs";
import { ToolDetailsDialog } from "../tool-editor/dialogs/tool-details-dialog";
import { Button } from "@/components/ui/button";
import { SaveIcon, Edit2Icon, LayersIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useStore } from "@tanstack/react-store";
import { toolBuilderActions, toolBuilderStore } from "./tool-editor.store";
import { toast } from "sonner";
import {
  getSavedCommandsFromStorage,
  removeSavedCommandFromStorage
} from "@/registry/commandly/lib/utils/commandly";
import { SavedCommandsDialog } from "./dialogs/saved-commands-dialog";

interface ToolEditorProps {
  tool: Tool;
  onSave?: (tool: Tool) => void;
}

export default function ToolEditor({
  tool: toolToEdit,
  onSave
}: ToolEditorProps) {
  const tool = useStore(toolBuilderStore, (state) => state.tool);

  useEffect(() => {
    toolBuilderActions.initializeTool(toolToEdit);
  }, [toolToEdit]);

  const [savedCommands, setSavedCommands] = useState<SavedCommand[]>([]);

  const handleDeleteCommand = (commandId: string) => {
    const toolId = tool.id || tool.name;
    removeSavedCommandFromStorage(`saved-${toolId}`, commandId);
    setSavedCommands(savedCommands.filter((cmd) => cmd.id !== commandId));
  };

  return (
    <div className="flex bg-background">
      <div className="w-72 border-r border-muted overflow-hidden flex flex-col">
        <div className="p-2 flex flex-col gap-2 border-b border-muted justify-center">
          <p className="p-3">Commands</p>
        </div>
        <CommandTree />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-muted">
          <div className="flex justify-between">
            <div className="flex items-center gap-2 justify-between">
              <span
                className="font-medium text-lg"
                style={{
                  viewTransitionName: `tool-card-title-${tool.name}`
                }}
              >
                {tool.displayName
                  ? `${tool.displayName} (${tool.name})`
                  : `${tool.name}`}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() =>
                  toolBuilderActions.setDialogOpen("editTool", true)
                }
              >
                <Edit2Icon className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {onSave && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    onSave(toolBuilderStore.state.tool);
                    toast("Tool saved successfully!");
                  }}
                >
                  <SaveIcon className="h-4 w-4 mr-2" />
                  Save
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const toolId = tool.id || tool.name;
                  const commands = getSavedCommandsFromStorage(toolId);
                  setSavedCommands(commands);
                  toolBuilderActions.setDialogOpen("savedCommands", true);
                }}
              >
                <SaveIcon className="h-4 w-4 mr-2" />
                Saved Commands
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  toolBuilderActions.setDialogOpen("exclusionGroups", true)
                }
              >
                <LayersIcon className="h-4 w-4 mr-2" />
                Exclusion Groups
              </Button>
            </div>
          </div>
        </div>

        <div className="flex content-between p-4 gap-4">
          <div className="flex flex-2/5 flex-col gap-4 min-w-80">
            <ParameterList title="Global Parameters" isGlobal={true} />
            <ParameterList title="Command Parameters" isGlobal={false} />
          </div>
          <div className="flex-3/5 max-w-3xl">
            <PreviewTabs />
          </div>
        </div>
      </div>

      <ParameterDetailsDialog />
      <ToolDetailsDialog />
      <SavedCommandsDialog
        savedCommands={savedCommands}
        onDeleteCommand={handleDeleteCommand}
      />
      <ExclusionGroupsDialog />
    </div>
  );
}
