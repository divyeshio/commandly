import { fetchToolDetails } from "@/lib/api/tools.api";
import { SavedCommand, Tool } from "@/registry/commandly/lib/types/commandly";
import {
  addSavedCommandToStorage,
  defaultTool,
  getSavedCommandsFromStorage,
  removeSavedCommandFromStorage,
  slugify,
} from "@/registry/commandly/lib/utils/commandly";
import ToolEditor from "@/registry/commandly/tool-editor/tool-editor";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/tools/$toolName/edit")({
  component: RouteComponent,
  validateSearch: (search) => ({
    newTool: typeof search.newTool === "string" ? search.newTool : undefined,
  }),
  loaderDeps: ({ search: { newTool } }) => ({
    newTool,
  }),
  loader: async ({ params: { toolName }, deps: { newTool } }) => {
    if (newTool) {
      const newToolData = localStorage.getItem(`tool-${newTool}`);
      if (newToolData) {
        return JSON.parse(newToolData) as Tool;
      } else {
        return defaultTool() as Tool;
      }
    } else {
      return await fetchToolDetails(toolName);
    }
  },
  ssr: false,
  head: (context) => ({
    meta: [
      {
        title: context.loaderData?.displayName ?? context.params.toolName,
      },
    ],
  }),
});

function RouteComponent() {
  const tool = Route.useLoaderData();
  const { newTool } = Route.useSearch();

  const [savedCommands, setSavedCommands] = useState<SavedCommand[]>(() =>
    tool ? getSavedCommandsFromStorage(tool.name) : [],
  );

  const handleSaveCommand = (command: string) => {
    const toolId = tool!.name;
    const existingCommands = getSavedCommandsFromStorage(toolId);
    if (existingCommands.some((cmd) => cmd.command === command)) {
      toast.error("Command already exists", {
        description: "This command has already been saved.",
      });
      return;
    }
    const newSavedCommand: SavedCommand = {
      key: slugify(command.substring(0, 20)),
      command,
    };
    addSavedCommandToStorage(`saved-${toolId}`, newSavedCommand);
    setSavedCommands(getSavedCommandsFromStorage(toolId));
    toast("Command Saved", { description: "Command has been saved successfully." });
  };

  const handleDeleteSavedCommand = (commandKey: string) => {
    const toolId = tool!.name;
    removeSavedCommandFromStorage(`saved-${toolId}`, commandKey);
    setSavedCommands(getSavedCommandsFromStorage(toolId));
  };

  return (
    <div className="mt-16">
    <ToolEditor
      tool={tool!}
      isNewTool={!!newTool}
      onSave={(tool) => {
        localStorage.setItem(`tool-${tool.name}`, JSON.stringify(tool));
      }}
      savedCommands={savedCommands}
      onSaveCommand={handleSaveCommand}
      onDeleteSavedCommand={handleDeleteSavedCommand}
    />
    </div>
  );
}
