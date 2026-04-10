import { ExclusionGroupsDialog } from "../tool-editor/dialogs/exclusion-groups-dialog";
import { ParameterDetailsDialog } from "../tool-editor/dialogs/parameter-details-dialog";
import { ToolDetailsDialog } from "../tool-editor/dialogs/tool-details-dialog";
import { AIChatPanel } from "./ai-chat";
import { CommandTree } from "./command-tree";
import { SavedCommandsDialog } from "./dialogs/saved-commands-dialog";
import { ParameterList } from "./parameter-list";
import { PreviewTabs } from "./preview-tabs";
import { ToolBuilderProvider, useToolBuilder } from "./tool-editor.context";
import { Tool } from "@/components/commandly/types/flat";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SavedCommand } from "@/lib/types";
import { SaveIcon, Edit2Icon, LayersIcon, GitPullRequestIcon, SparklesIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const GITHUB_REPO = "divyeshio/commandly";
const MAX_URL_JSON_LENGTH = 4000;

interface ToolEditorProps {
  tool: Tool;
  onSave?: (tool: Tool) => void;
  isNewTool?: boolean;
  savedCommands?: SavedCommand[];
  onSaveCommand?: (command: string) => void;
  onDeleteSavedCommand?: (commandKey: string) => void;
}

export default function ToolEditor({
  tool: toolToEdit,
  onSave,
  isNewTool = false,
  savedCommands,
  onSaveCommand,
  onDeleteSavedCommand,
}: ToolEditorProps) {
  return (
    <ToolBuilderProvider tool={toolToEdit}>
      <ToolEditorContent
        onSave={onSave}
        isNewTool={isNewTool}
        savedCommands={savedCommands ?? []}
        onSaveCommand={onSaveCommand}
        onDeleteSavedCommand={onDeleteSavedCommand}
      />
    </ToolBuilderProvider>
  );
}

interface ToolEditorContentProps {
  onSave?: (tool: Tool) => void;
  isNewTool?: boolean;
  savedCommands: SavedCommand[];
  onSaveCommand?: (command: string) => void;
  onDeleteSavedCommand?: (commandKey: string) => void;
}

function ToolEditorContent({
  onSave,
  isNewTool = false,
  savedCommands,
  onSaveCommand,
  onDeleteSavedCommand,
}: ToolEditorContentProps) {
  const {
    tool,
    setDialogOpen,
    initializeTool,
    selectedParameter,
    upsertParameter,
    setSelectedParameter,
  } = useToolBuilder();
  const [chatOpen, setChatOpen] = useState(false);
  const [streamingTool, setStreamingTool] = useState<Tool | null>(null);
  const [isAIGenerating, setIsAIGenerating] = useState(false);

  const [initialToolJson, setInitialToolJson] = useState(() => JSON.stringify(tool));
  const isDirty = JSON.stringify(tool) !== initialToolJson;
  const hasAtLeastOneCommand = Array.isArray(tool.commands) && tool.commands.length > 0;
  const isValid = tool.name.trim() !== "" && tool.displayName.trim() !== "" && hasAtLeastOneCommand;

  const handleContribute = async () => {
    const json = JSON.stringify(tool, null, 2);
    const filePath = `public/tools-collection/${tool.name}.json`;

    if (isNewTool) {
      const message = encodeURIComponent(`feat(tools): add ${tool.name}`);
      const filename = encodeURIComponent(filePath);
      if (json.length <= MAX_URL_JSON_LENGTH) {
        window.open(
          `https://github.com/${GITHUB_REPO}/new/main?filename=${filename}&value=${encodeURIComponent(json)}&message=${message}`,
          "_blank",
        );
      } else {
        await navigator.clipboard.writeText(json);
        toast("JSON copied to clipboard", {
          description: "Paste it into the file editor that will open.",
        });
        window.open(
          `https://github.com/${GITHUB_REPO}/new/main?filename=${filename}&message=${message}`,
          "_blank",
        );
      }
    } else {
      await navigator.clipboard.writeText(json);
      toast("JSON copied to clipboard", {
        description: "Paste it into the file editor that will open to create a PR.",
      });
      window.open(`https://github.com/${GITHUB_REPO}/edit/main/${filePath}`, "_blank");
    }
  };

  return (
    <div className="flex h-[calc(100svh-4rem)] bg-background">
      <div className="flex h-full w-72 flex-col overflow-hidden">
        <div className="flex flex-col justify-center gap-2 border-t border-r border-b border-muted p-1">
          <p className="p-2">Commands</p>
        </div>
        <CommandTree />
      </div>

      <div className="flex h-full flex-1 flex-col overflow-hidden">
        <div className="border-t border-b border-muted p-2">
          <div className="flex justify-between">
            <div className="flex items-center justify-between gap-2">
              <span
                className="ml-3 text-lg font-medium"
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
                aria-label="Edit tool"
                onClick={() => setDialogOpen("editTool", true)}
              >
                <Edit2Icon className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {onSave && (
                <>
                  {isDirty && !isValid && (
                    <span className="text-xs text-destructive">
                      Name, display name, and at least one command are required
                    </span>
                  )}
                  <Button
                    variant="default"
                    size="sm"
                    disabled={!isDirty || !isValid}
                    onClick={() => {
                      onSave(tool);
                      setInitialToolJson(JSON.stringify(tool));
                      toast("Tool saved successfully!");
                    }}
                  >
                    <SaveIcon className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDialogOpen("savedCommands", true)}
              >
                <SaveIcon className="mr-2 h-4 w-4" />
                Saved Commands
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDialogOpen("exclusionGroups", true)}
              >
                <LayersIcon className="mr-2 h-4 w-4" />
                Exclusion Groups
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleContribute}
              >
                <GitPullRequestIcon className="mr-2 h-4 w-4" />
                Contribute
              </Button>
              <Button
                variant={chatOpen ? "default" : "outline"}
                size="sm"
                onClick={() => setChatOpen((o) => !o)}
              >
                <SparklesIcon className="mr-2 h-4 w-4" />
                Generate
              </Button>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className="flex min-h-0 flex-1 gap-4 overflow-hidden p-4">
            <div className="flex min-w-80 flex-2/5 flex-col overflow-hidden">
              <ScrollArea className="h-full">
                <div className="flex flex-col gap-4 pr-3 pb-4">
                  <ParameterList
                    title="Global Parameters"
                    isGlobal={true}
                  />
                  <ParameterList
                    title="Command Parameters"
                    isGlobal={false}
                  />
                </div>
              </ScrollArea>
            </div>
            <div className="h-full max-w-3xl flex-3/5 overflow-hidden">
              <PreviewTabs
                onSaveCommand={onSaveCommand}
                streamingTool={streamingTool}
                isAIGenerating={isAIGenerating}
              />
            </div>
          </div>
          <AIChatPanel
            tool={tool}
            onApply={initializeTool}
            isOpen={chatOpen}
            onStreamingTool={setStreamingTool}
            onGeneratingChange={setIsAIGenerating}
          />
        </div>
      </div>

      {selectedParameter && (
        <ParameterDetailsDialog
          parameter={selectedParameter.key ? selectedParameter : undefined}
          isGlobal={selectedParameter.isGlobal}
          onSave={(param) => {
            upsertParameter(param, selectedParameter.key || undefined);
            setSelectedParameter(null);
          }}
        />
      )}
      <ToolDetailsDialog />
      <SavedCommandsDialog
        savedCommands={savedCommands}
        onDeleteCommand={onDeleteSavedCommand ?? (() => {})}
      />
      <ExclusionGroupsDialog />
    </div>
  );
}
