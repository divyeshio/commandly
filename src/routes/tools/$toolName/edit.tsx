import ToolEditor from "@/components/tool-editor/tool-editor";
import { fetchToolDetails } from "@/lib/api/tools.api";
import {
  addSavedCommandToStorage,
  getSavedCommandsFromStorage,
  removeSavedCommandFromStorage,
} from "@/lib/editor-utils";
import { SavedCommand } from "@/lib/types";
import { Tool } from "@/registry/commandly/lib/types/commandly";
import { slugify } from "@/registry/commandly/lib/utils/commandly";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/tools/$toolName/edit")({
  component: RouteComponent,
  validateSearch: (search) => ({
    isNew: search.isNew === true,
    isLocal: search.isLocal === true,
  }),
  loaderDeps: ({ search: { isNew, isLocal } }) => ({
    isNew,
    isLocal,
  }),
  loader: async ({ params: { toolName }, deps: { isNew } }) => {
    if (isNew) {
      return { name: "", displayName: "", commands: [], parameters: [] } as Tool;
    } else {
      const local = localStorage.getItem(`tool-${toolName}`);
      if (local) return JSON.parse(local) as Tool;
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
  const { isNew, isLocal } = Route.useSearch();

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
        isNewTool={!!isNew || !!isLocal}
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
