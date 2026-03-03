import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Command } from "@/registry/commandly/lib/types/commandly";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  Edit2Icon,
  PlusIcon,
  Trash2Icon
} from "lucide-react";
import { CommandDialog } from "../tool-editor/dialogs/command-dialog";
import { useStore } from "@tanstack/react-store";
import { toolBuilderStore, toolBuilderActions } from "./tool-editor.store";

interface CommandNodeProps {
  command: Command;
  level?: number;
  allCommands: Command[];
  toolName: string;
  selectedCommandId?: string;
  expandedCommands: Set<string>;
  onToggle: (commandId: string) => void;
  onEdit: (command: Command) => void;
  onAddSubcommand: (parentId?: string) => void;
  onDelete: (commandId: string) => void;
}

function CommandNode({
  command,
  level = 0,
  allCommands,
  toolName,
  selectedCommandId,
  expandedCommands,
  onToggle,
  onEdit,
  onAddSubcommand,
  onDelete
}: CommandNodeProps) {
  const isExpanded = expandedCommands.has(command.id);
  const subcommands = allCommands.filter(
    (cmd) => cmd.parentCommandId === command.id
  );
  const hasSubcommands = subcommands.length > 0;
  const isSelected = selectedCommandId === command.id;
  const isRoot = command.name === toolName;

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
              onToggle(command.id);
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
            onEdit(command);
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
            onAddSubcommand(command.id);
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
              onDelete(command.id);
            }}
          >
            <Trash2Icon className="h-3 w-3 text-destructive" />
          </Button>
        )}
      </div>

      {isExpanded && hasSubcommands && (
        <div>
          {subcommands.map((subcmd) => (
            <CommandNode
              key={subcmd.id}
              command={subcmd}
              level={level + 1}
              allCommands={allCommands}
              toolName={toolName}
              selectedCommandId={selectedCommandId}
              expandedCommands={expandedCommands}
              onToggle={onToggle}
              onEdit={onEdit}
              onAddSubcommand={onAddSubcommand}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

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
    const newCmd = toolBuilderStore.state.tool.commands.find(
      (cmd) => !prevIds.has(cmd.id)
    );
    if (newCmd) {
      setLastAddedCommand({ id: newCmd.id, parentId });
    }
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

  const handleEdit = (command: Command) => {
    toolBuilderActions.setEditingCommand(command);
    setIsDialogOpen(true);
  };

  const rootCommands = tool.commands.filter((cmd) => !cmd.parentCommandId);

  return (
    <>
      <ScrollArea className="flex-1 p-1">
        <div className="p-2">
          {rootCommands.map((command) => (
            <CommandNode
              key={command.id}
              command={command}
              allCommands={tool.commands}
              toolName={tool.name}
              selectedCommandId={selectedCommand?.id}
              expandedCommands={expandedCommands}
              onToggle={toggleExpanded}
              onEdit={handleEdit}
              onAddSubcommand={handleAddSubcommand}
              onDelete={toolBuilderActions.deleteCommand}
            />
          ))}
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
            toolBuilderActions.setEditingCommand(null);
          }}
        />
      )}
    </>
  );
}
