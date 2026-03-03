import { ExclusionGroupsDialog } from "../tool-editor/dialogs/exclusion-groups-dialog";
import { ParameterDetailsDialog } from "../tool-editor/dialogs/parameter-details-dialog";
import { ToolDetailsDialog } from "../tool-editor/dialogs/tool-details-dialog";
import { CommandTree } from "./command-tree";
import { SavedCommandsDialog } from "./dialogs/saved-commands-dialog";
import { ParameterList } from "./parameter-list";
import { PreviewTabs } from "./preview-tabs";
import { toolBuilderActions, toolBuilderStore } from "./tool-editor.store";
import { Button } from "@/components/ui/button";
import { SavedCommand, Tool } from "@/registry/commandly/lib/types/commandly";
import {
  getSavedCommandsFromStorage,
  removeSavedCommandFromStorage,
} from "@/registry/commandly/lib/utils/commandly";
import { useStore } from "@tanstack/react-store";
import { SaveIcon, Edit2Icon, LayersIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface ToolEditorProps {
  tool: Tool;
  onSave?: (tool: Tool) => void;
}

export default function ToolEditor({ tool: toolToEdit, onSave }: ToolEditorProps) {
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
      <div className="flex w-72 flex-col overflow-hidden border-r border-muted">
        <div className="flex flex-col justify-center gap-2 border-b border-muted p-2">
          <p className="p-3">Commands</p>
        </div>
        <CommandTree />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        <div className="border-b border-muted p-4">
          <div className="flex justify-between">
            <div className="flex items-center justify-between gap-2">
              <span
                className="text-lg font-medium"
                style={{
                  viewTransitionName: `tool-card-title-${tool.name}`,
                }}
              >
                {tool.displayName ? `${tool.displayName} (${tool.name})` : `${tool.name}`}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => toolBuilderActions.setDialogOpen("editTool", true)}
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
                  <SaveIcon className="mr-2 h-4 w-4" />
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
                <SaveIcon className="mr-2 h-4 w-4" />
                Saved Commands
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toolBuilderActions.setDialogOpen("exclusionGroups", true)}
              >
                <LayersIcon className="mr-2 h-4 w-4" />
                Exclusion Groups
              </Button>
            </div>
          </div>
        </div>

        <div className="flex content-between gap-4 p-4">
          <div className="flex min-w-80 flex-2/5 flex-col gap-4">
            <ParameterList
              title="Global Parameters"
              isGlobal={true}
            />
            <ParameterList
              title="Command Parameters"
              isGlobal={false}
            />
          </div>
          <div className="max-w-3xl flex-3/5">
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
