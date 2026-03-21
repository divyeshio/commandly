import { CommandDialog } from "../tool-editor/dialogs/command-dialog";
import { useToolBuilder } from "./tool-editor.context";
import { Command } from "@/commandly/lib/types/flat";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDownIcon, ChevronRightIcon, Edit2Icon, PlusIcon, Trash2Icon } from "lucide-react";
import { useState, useEffect } from "react";

interface CommandNodeProps {
  command: Command;
  level?: number;
  allCommands: Command[];
  toolName: string;
  selectedCommandKey?: string;
  expandedCommands: Set<string>;
  onToggle: (commandKey: string) => void;
  onSelect: (command: Command) => void;
  onEdit: (command: Command) => void;
  onAddSubcommand: (parentKey?: string) => void;
  onDelete: (commandKey: string) => void;
}

function CommandNode({
  command,
  level = 0,
  allCommands,
  toolName,
  selectedCommandKey,
  expandedCommands,
  onToggle,
  onSelect,
  onEdit,
  onAddSubcommand,
  onDelete,
}: CommandNodeProps) {
  const isExpanded = expandedCommands.has(command.key);
  const subcommands = allCommands.filter((cmd) => cmd.parentCommandKey === command.key);
  const hasSubcommands = subcommands.length > 0;
  const isSelected = selectedCommandKey === command.key;
  const isRoot = command.name === toolName;

  return (
    <div key={command.key}>
      <div
        className={`group flex cursor-pointer items-center gap-2 rounded-md p-2 hover:bg-muted/50 ${
          isSelected ? "bg-muted" : ""
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => onSelect(command)}
      >
        {hasSubcommands ? (
          <Button
            id="expand-button"
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(command.key);
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

        <span className="flex-1 text-sm font-medium">{command.name}</span>
        {command.isDefault && (
          <Badge
            variant="secondary"
            className="text-xs"
          >
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
            onAddSubcommand(command.key);
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
              onDelete(command.key);
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
              key={subcmd.key}
              command={subcmd}
              level={level + 1}
              allCommands={allCommands}
              toolName={toolName}
              selectedCommandKey={selectedCommandKey}
              expandedCommands={expandedCommands}
              onToggle={onToggle}
              onSelect={onSelect}
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
  const {
    tool,
    selectedCommand,
    editingCommand,
    addSubcommand,
    setSelectedCommand,
    setEditingCommand,
    deleteCommand,
  } = useToolBuilder();

  const [expandedCommands, setExpandedCommands] = useState<Set<string>>(
    new Set([tool.commands[0]?.key]),
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [lastAddedCommand, setLastAddedCommand] = useState<{
    key: string;
    parentKey?: string;
  } | null>(null);

  const toggleExpanded = (commandKey: string) => {
    setExpandedCommands((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(commandKey)) {
        newSet.delete(commandKey);
      } else {
        newSet.add(commandKey);
      }
      return newSet;
    });
  };

  const handleAddSubcommand = (parentKey?: string) => {
    const newKey = addSubcommand(parentKey);
    setLastAddedCommand({ key: newKey, parentKey });
  };

  useEffect(() => {
    if (!lastAddedCommand) return;
    const { key, parentKey } = lastAddedCommand;
    const newCmd = tool.commands.find((cmd) => cmd.key === key);
    if (newCmd) {
      setSelectedCommand(newCmd);
      if (parentKey) {
        setExpandedCommands((prev) => {
          const newSet = new Set(prev);
          newSet.add(parentKey);
          return newSet;
        });
      }
      setLastAddedCommand(null);
    }
  }, [tool.commands, lastAddedCommand, setSelectedCommand]);

  const handleEdit = (command: Command) => {
    setEditingCommand(command);
    setIsDialogOpen(true);
  };

  const rootCommands = tool.commands.filter((cmd) => !cmd.parentCommandKey);

  return (
    <>
      <ScrollArea className="flex-1 border-r border-muted p-1">
        <div className="p-2">
          {rootCommands.map((command) => (
            <CommandNode
              key={command.key}
              command={command}
              allCommands={tool.commands}
              toolName={tool.name}
              selectedCommandKey={selectedCommand?.key}
              expandedCommands={expandedCommands}
              onToggle={toggleExpanded}
              onSelect={setSelectedCommand}
              onEdit={handleEdit}
              onAddSubcommand={handleAddSubcommand}
              onDelete={deleteCommand}
            />
          ))}
        </div>
        <div className="p-2">
          <Button
            className="w-full"
            onClick={() => handleAddSubcommand()}
          >
            <PlusIcon className="mr-1 h-3 w-3" />
            Add Command
          </Button>
        </div>
      </ScrollArea>
      {editingCommand && (
        <CommandDialog
          isOpen={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            setEditingCommand(null);
          }}
        />
      )}
    </>
  );
}
