import { Tool } from "@/components/commandly/types/flat";
import { slugify } from "@/components/commandly/utils/flat";
import ToolEditor from "@/components/tool-editor/tool-editor";
import { fetchToolDetails } from "@/lib/api/tools.api";
import {
  addSavedCommandToStorage,
  getSavedCommandsFromStorage,
  removeSavedCommandFromStorage,
} from "@/lib/editor-utils";
import { SavedCommand } from "@/lib/types";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/tools/$toolName/edit")({
  component: RouteComponent,
  validateSearch: (search) => ({
    isLocal: search.isLocal === true,
  }),
  loaderDeps: ({ search: { isLocal } }) => ({
    isLocal,
  }),
  loader: async ({ params: { toolName } }) => {
    const local = localStorage.getItem(`tool-${toolName}`);
    if (local) return JSON.parse(local) as Tool;
    return await fetchToolDetails(toolName);
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
  const { isLocal } = Route.useSearch();

  const [savedCommands, setSavedCommands] = useState<SavedCommand[]>(() =>
    tool ? getSavedCommandsFromStorage(tool.binaryName) : [],
  );

  const handleSaveCommand = (command: string) => {
    const toolId = tool!.binaryName;
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
    addSavedCommandToStorage(toolId, newSavedCommand);
    setSavedCommands(getSavedCommandsFromStorage(toolId));
    toast("Command Saved", { description: "Command has been saved successfully." });
  };

  const handleDeleteSavedCommand = (commandKey: string) => {
    const toolId = tool!.binaryName;
    removeSavedCommandFromStorage(toolId, commandKey);
    setSavedCommands(getSavedCommandsFromStorage(toolId));
  };

  return (
    <div className="mt-16 overflow-x-hidden">
      <ToolEditor
        tool={tool!}
        isNewTool={!!isLocal}
        onSave={(tool) => {
          localStorage.setItem(`tool-${tool.binaryName}`, JSON.stringify(tool));
        }}
        savedCommands={savedCommands}
        onSaveCommand={handleSaveCommand}
        onDeleteSavedCommand={handleDeleteSavedCommand}
      />
    </div>
  );
}
