import { Tool } from "@/lib/types/tool-editor";
import { CommandTree } from "@/components/tool-editor-ui/command-tree";
import { ParameterList } from "@/components/tool-editor-ui/parameter-list";
import { ParameterDetailsDialog } from "@/components/tool-editor-ui/dialogs/parameter-details-dialog";
import { ExclusionGroupsDialog } from "@/components/tool-editor-ui/dialogs/exclusion-groups-dialog";
import { PreviewTabs } from "@/components/tool-editor-ui/preview-tabs";
import { ToolDetailsDialog } from "@/components/tool-editor-ui/dialogs/tool-details-dialog";
import { SavedCommandsDialog } from "@/components/tool-editor-ui/dialogs/saved-commands-dialog";
import { Button } from "@/components/ui/button";
import { SaveIcon, Edit2Icon, LayersIcon } from "lucide-react";
import { useEffect } from "react";
import { useStore } from "@tanstack/react-store";
import {
  toolBuilderActions,
  toolBuilderSelectors,
  toolBuilderStore,
} from "@/components/tool-editor-ui/tool-editor.store";

interface ToolEditorProps {
  tool: Tool;
}

export default function ToolEditor({ tool: toolToEdit }: ToolEditorProps) {
  const tool = useStore(toolBuilderStore, (state) => state.tool);
  const selectedCommand = useStore(
    toolBuilderStore,
    (state) => state.selectedCommand
  );
  const selectedParameter = useStore(
    toolBuilderStore,
    (state) => state.selectedParameterId
  );

  const globalParameters = useStore(toolBuilderStore, (state) =>
    toolBuilderSelectors.getGlobalParameters(state)
  );
  const currentParameters = useStore(toolBuilderStore, (state) =>
    selectedCommand?.id
      ? toolBuilderSelectors.getParametersForCommand(state, selectedCommand.id)
      : []
  );

  useEffect(() => {
    toolBuilderActions.initializeTool(toolToEdit);
  }, [toolToEdit]);

  const selectedParam = [...globalParameters, ...currentParameters].find(
    (p) => p.id === selectedParameter
  );

  return (
    <div className="flex bg-background">
      <div className="w-72 border-r overflow-hidden flex flex-col">
        <div className="p-2 flex flex-col gap-2 border-b justify-center">
          <p className="p-3">Commands</p>
        </div>
        <CommandTree />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b">
          <div className="flex justify-between">
            <div className="flex items-center gap-2 justify-between">
              <span className="font-medium text-lg">
                {tool.displayName
                  ? `${tool.displayName} (${tool.name})`
                  : `${tool.name}`}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => toolBuilderActions.setEditToolDialogOpen(true)}
              >
                <Edit2Icon className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  toolBuilderActions.setSavedCommandsDialogOpen(true)
                }
              >
                <SaveIcon className="h-4 w-4 mr-2" />
                Saved Commands
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  toolBuilderActions.setExclusionGroupsDialogOpen(true)
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

      {selectedParam && (
        <ParameterDetailsDialog
          isOpen={!!selectedParameter}
          onOpenChange={(open) => {
            if (!open) {
              toolBuilderActions.setSelectedParameterId("");
            }
          }}
        />
      )}

      <ToolDetailsDialog />
      <SavedCommandsDialog />
      <ExclusionGroupsDialog />
    </div>
  );
}
