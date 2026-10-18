import { ExclusionGroupsDialog } from "../tool-editor/dialogs/exclusion-groups-dialog";
import { ParameterDetailsDialog } from "../tool-editor/dialogs/parameter-details-dialog";
import { ToolDetailsDialog } from "../tool-editor/dialogs/tool-details-dialog";
import { AIChatPanel } from "./ai-chat";
import { CommandTree } from "./command-tree";
import { SavedCommandsDialog } from "./dialogs/saved-commands-dialog";
import { ParameterList } from "./parameter-list";
import { PreviewTabs } from "./preview-tabs";
import { ToolBuilderProvider, useToolBuilder } from "./tool-editor.context";
import { Tool } from "@/components/commandly/types/tool";
import { getCommandParameters } from "@/components/commandly/utils/tool";
import { fixTool } from "@/components/commandly/utils/tool-file";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SavedCommand } from "@/lib/types";
import { useBlocker } from "@tanstack/react-router";
import { SaveIcon, Edit2Icon, LayersIcon, GitPullRequestIcon, SparklesIcon } from "lucide-react";
import { parseAsBoolean, useQueryState } from "nuqs";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const GITHUB_REPO = "divyeshio/commandly";
const MAX_URL_JSON_LENGTH = 4000;

/** Which of an owner's parameters the AI added, changed or removed relative to the loaded tool. */
function diffParameters(before: Tool["parameters"], after: Tool["parameters"]) {
  const beforeByKey = new Map(before.map((parameter) => [parameter.key, parameter]));
  const afterByKey = new Map(after.map((parameter) => [parameter.key, parameter]));

  const added = new Set([...afterByKey.keys()].filter((key) => !beforeByKey.has(key)));
  const removed = new Set([...beforeByKey.keys()].filter((key) => !afterByKey.has(key)));
  const updated = new Set(
    [...afterByKey]
      .filter(([key, parameter]) => {
        const previous = beforeByKey.get(key);
        return previous !== undefined && JSON.stringify(previous) !== JSON.stringify(parameter);
      })
      .map(([key]) => key),
  );

  return added.size || removed.size || updated.size ? { added, updated, removed } : undefined;
}

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
    originalTool,
    dialogs,
    setDialogOpen,
    initializeTool,
    selectedParameter,
    selectedCommand,
    upsertParameter,
    setSelectedParameter,
  } = useToolBuilder();
  const [chatOpen, setChatOpen] = useQueryState("ai", parseAsBoolean.withDefault(false));
  const [streamingTool, setStreamingTool] = useState<Tool | null>(null);
  const [isAIGenerating, setIsAIGenerating] = useState(false);

  const [initialToolJson, setInitialToolJson] = useState(() => JSON.stringify(tool));
  const toolJson = useMemo(() => JSON.stringify(tool), [tool]);
  const isDirty = toolJson !== initialToolJson;
  const isValid = (tool.binaryName ?? "").trim() !== "" && (tool.displayName ?? "").trim() !== "";
  const shouldBlockNavigation = isDirty || isAIGenerating;

  useBlocker({
    shouldBlockFn: () => {
      if (!shouldBlockNavigation) return false;

      const reason = isAIGenerating
        ? "An AI message is still in progress. Leave this page?"
        : "You have unsaved changes. Leave this page?";

      return !window.confirm(reason);
    },
    enableBeforeUnload: shouldBlockNavigation,
  });

  const selectedCommandKey = selectedCommand?.key ?? null;
  const pendingChanges = useMemo(
    () =>
      diffParameters(
        getCommandParameters(originalTool, selectedCommandKey),
        getCommandParameters(streamingTool ?? tool, selectedCommandKey),
      ),
    [originalTool, tool, streamingTool, selectedCommandKey],
  );

  const handleContribute = async () => {
    const json = JSON.stringify(fixTool(tool, { removeMetadata: true }), null, 2);
    const filePath = `public/tools-collection/${tool.binaryName}.json`;

    if (isNewTool) {
      const message = encodeURIComponent(`feat(tools): add ${tool.binaryName}`);
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
    <div className="flex h-[calc(100svh-4rem)] flex-col bg-background">
      <div className="flex border-t border-b border-muted">
        <div className="flex w-72 shrink-0 items-center border-r border-muted px-3 py-2">
          <p className="text-sm font-medium">Commands</p>
        </div>
        <div className="flex-1 p-2">
          <div className="flex justify-between">
            <div className="flex items-center justify-between gap-2">
              <span
                className="ml-3 text-lg font-medium"
                style={{
                  viewTransitionName: `tool-card-title-${tool.binaryName}`,
                }}
              >
                {tool.displayName
                  ? `${tool.displayName} (${tool.binaryName})`
                  : `${tool.binaryName}`}
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
                      Name and display name are required
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
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex w-72 shrink-0 flex-col overflow-hidden pt-2">
          <CommandTree isChatOpen={chatOpen} />
        </div>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className="flex min-h-0 flex-1 gap-4 overflow-hidden p-4">
            <div className="flex min-w-80 flex-2/5 flex-col overflow-hidden">
              <ScrollArea className="h-full">
                <div className="flex flex-col gap-4 pr-3 pb-4">
                  <ParameterList
                    title={
                      selectedCommand
                        ? `${selectedCommand.displayName} Parameters`
                        : "Root Parameters"
                    }
                    isChatOpen={chatOpen}
                    pendingChanges={pendingChanges}
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
          onSave={(param) => {
            upsertParameter(param, selectedParameter.key || undefined);
            setSelectedParameter(null);
          }}
        />
      )}
      <ToolDetailsDialog />
      <SavedCommandsDialog
        open={dialogs.savedCommands}
        onOpenChange={(open) => setDialogOpen("savedCommands", open)}
        savedCommands={savedCommands}
        onDeleteCommand={onDeleteSavedCommand ?? (() => {})}
      />
      <ExclusionGroupsDialog />
    </div>
  );
}
