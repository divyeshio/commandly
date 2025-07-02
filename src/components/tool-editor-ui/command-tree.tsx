import { useState, useEffect, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Command } from "@/lib/types/tool-editor";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  Edit2Icon,
  PlusIcon,
  Trash2Icon
} from "lucide-react";
import { CommandDialog } from "./dialogs/command-dialog";
import { useStore } from "@tanstack/react-store";
import {
  toolBuilderStore,
  toolBuilderActions
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
    new Set([tool.commands[0]?.id])
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [lastAddedCommand, setLastAddedCommand] = useState<{
    id: string;
    parentId?: string;
  } | null>(null);

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

  // Patch toolBuilderActions.addSubcommand to select and expand parent after add
  const handleAddSubcommand = (parentId?: string) => {
    const prevIds = new Set(tool.commands.map((cmd) => cmd.id));
    toolBuilderActions.addSubcommand(parentId);
    setTimeout(() => {
      const newCmd = toolBuilderStore.state.tool.commands.find(
        (cmd) => !prevIds.has(cmd.id)
      );
      if (newCmd) {
        setLastAddedCommand({ id: newCmd.id, parentId });
      }
    }, 0);
  };

  useEffect(() => {
    if (!lastAddedCommand) return;
    const { id, parentId } = lastAddedCommand;
    const newCmd = tool.commands.find((cmd) => cmd.id === id);
    if (newCmd) {
      toolBuilderActions.setSelectedCommand(newCmd);
      if (parentId) {
        setExpandedCommands((prev) => {
          const newSet = new Set(prev);
          newSet.add(parentId);
          return newSet;
        });
      }
      setLastAddedCommand(null);
    }
  }, [tool.commands, lastAddedCommand]);

  const renderCommandNode = (command: Command, level = 0): ReactNode => {
    const isExpanded = expandedCommands.has(command.id);
    const subcommands = tool.commands.filter(
      (cmd) => cmd.parentCommandId === command.id
    );
    const hasSubcommands = subcommands.length > 0;
    const isSelected = selectedCommand?.id === command.id;
    const isRoot = command.name == tool.name;

    return (
      <div key={command.id}>
        <div
          className={`flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted/50 group ${
            isSelected ? "bg-muted" : ""
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => toolBuilderActions.setSelectedCommand(command)}
        >
          {hasSubcommands ? (
            <Button
              id="expand-button"
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(command.id);
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
              handleAddSubcommand(command.id);
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
                toolBuilderActions.deleteCommand(command.id);
              }}
            >
              <Trash2Icon className="h-3 w-3 text-destructive" />
            </Button>
          )}
        </div>

        {isExpanded && hasSubcommands && (
          <>
            <div>
              {subcommands.map((subcmd) =>
                renderCommandNode(subcmd, level + 1)
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  const rootCommands = tool.commands.filter((cmd) => !cmd.parentCommandId);

  return (
    <>
      <ScrollArea className="flex-1 p-1">
        <div className="p-2">
          {rootCommands.map((command) => renderCommandNode(command))}
        </div>
        <div className="p-2">
          <Button className="w-full" onClick={() => handleAddSubcommand()}>
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
