import { type JSX, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Command } from "@/lib/types/tool-editor";
import { buildCommandHierarchy } from "@/lib/utils/tool-editor";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  Edit2Icon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { CommandDialog } from "./dialogs/command-dialog";
import { useStore } from "@tanstack/react-store";
import {
  toolBuilderStore,
  toolBuilderActions,
} from "@/components/tool-editor-ui/tool-editor.store";

export function CommandTree() {
  const tool = useStore(toolBuilderStore, (state) => state.tool);
  const selectedCommand = useStore(
    toolBuilderStore,
    (state) => state.selectedCommand
  );
  const editingCommand = useStore(
    toolBuilderStore,
    (state) => state.editingCommand
  );

  const [expandedCommands, setExpandedCommands] = useState<Set<string>>(
    new Set([tool.name])
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleEditCommand = (command: Command | null) => {
    toolBuilderActions.setEditingCommand(command);
  };

  const toggleExpanded = (commandId: string) => {
    setExpandedCommands((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(commandId)) {
        newSet.delete(commandId);
      } else {
        newSet.add(commandId);
      }
      return newSet;
    });
  };

  const renderCommandNode = (command: Command, level = 0): JSX.Element => {
    const isExpanded = expandedCommands.has(command.name);
    const hasSubcommands = command.subcommands.length > 0;
    const isSelected = selectedCommand?.name === command.name;
    const isRoot = command.name == tool.name;

    return (
      <div key={command.name}>
        <div
          className={`flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted/50 group ${
            isSelected ? "bg-muted" : ""
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => toolBuilderActions.setSelectedCommand(command)}
        >
          {hasSubcommands ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(command.name);
              }}
            >
              {isExpanded ? (
                <ChevronDownIcon className="h-3 w-3" />
              ) : (
                <ChevronRightIcon className="h-3 w-3" />
              )}
            </Button>
          ) : (
            <div className="w-4" />
          )}

          <span className="text-sm font-medium flex-1">{command.name}</span>
          {command.isDefault && (
            <Badge variant="secondary" className="text-xs">
              default
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              handleEditCommand(command);
              setIsDialogOpen(true);
            }}
          >
            <Edit2Icon className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              toolBuilderActions.addSubcommand(command.name);
            }}
          >
            <PlusIcon className="h-3 w-3" />
          </Button>
          {!isRoot && (
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                toolBuilderActions.deleteCommand(command.name);
              }}
            >
              <Trash2Icon className="h-3 w-3 text-destructive" />
            </Button>
          )}
        </div>

        {isExpanded && hasSubcommands && (
          <>
            <div>
              {command.subcommands.map((subcmd) =>
                renderCommandNode(subcmd, level + 1)
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  const commandHierarchy = buildCommandHierarchy(tool.commands);

  return (
    <>
      <ScrollArea className="flex-1 p-1">
        <div className="p-2">
          {commandHierarchy.map((command) => renderCommandNode(command))}
        </div>
        <div className="p-2">
          <Button
            className="w-full"
            onClick={() => toolBuilderActions.addSubcommand(null!)}
          >
            <PlusIcon className="h-3 w-3 mr-1" />
            Add Command
          </Button>
        </div>
      </ScrollArea>
      {editingCommand && (
        <CommandDialog
          isOpen={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            handleEditCommand(null);
          }}
        />
      )}
    </>
  );
}
