import { CommandDialog } from "../tool-editor/dialogs/command-dialog";
import { useToolBuilder } from "./tool-editor.context";
import { Command } from "@/components/commandly/types/flat";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tree, Folder, File } from "@/components/ui/file-tree";
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
  SortableOverlay,
} from "@/components/ui/sortable";
import { cn } from "@/lib/utils";
import { ChevronRightIcon, Edit2Icon, GripVerticalIcon, PlusIcon, TerminalIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";

const ROOT_ID = "__root__";

function CommandActions({
  onEdit,
  onAdd,
  onDelete,
  showHandle = false,
}: {
  onEdit?: () => void;
  onAdd: () => void;
  onDelete?: () => void;
  showHandle?: boolean;
}) {
  return (
    <>
      {showHandle && (
        <SortableItemHandle asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
          >
            <GripVerticalIcon className="h-3 w-3" />
          </Button>
        </SortableItemHandle>
      )}
      {onEdit && (
        <Button variant="ghost" size="sm" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100" onClick={onEdit}>
          <Edit2Icon className="h-3 w-3" />
        </Button>
      )}
      <Button variant="ghost" size="sm" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100" onClick={onAdd}>
        <PlusIcon className="h-3 w-3" />
      </Button>
      {onDelete && (
        <Button variant="ghost" size="sm" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100" onClick={onDelete}>
          <Trash2Icon className="h-3 w-3 text-destructive" />
        </Button>
      )}
    </>
  );
}

export function CommandTree({ isChatOpen = false }: { isChatOpen?: boolean }) {
  const {
    tool,
    selectedCommand,
    contextSelection,
    addCommand,
    setSelectedCommand,
    setContextSelection,
    updateCommand,
    deleteCommand,
    reorderCommands,
  } = useToolBuilder();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogCommand, setDialogCommand] = useState<Command | undefined>(undefined);
  const [pendingParentKey, setPendingParentKey] = useState<string | undefined>(undefined);

  const lastSelectedCommandIndexRef = { current: null as number | null };

  const handleAddSubcommand = (parentKey?: string) => {
    setDialogCommand(undefined);
    setPendingParentKey(parentKey);
    setIsDialogOpen(true);
  };

  const handleEdit = (command: Command) => {
    setDialogCommand(command);
    setPendingParentKey(undefined);
    setIsDialogOpen(true);
  };

  const handleRootClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCommand(null);
    setContextSelection({ commandKeys: [], parameterKeys: [] });
  };

  const handleCommandClick = (command: Command, e: React.MouseEvent) => {
    e.stopPropagation();
    const flatCommands = tool.commands;
    const index = flatCommands.findIndex((c) => c.key === command.key);

    if (e.ctrlKey || e.metaKey) {
      const already = contextSelection.commandKeys.includes(command.key);
      setContextSelection({
        ...contextSelection,
        commandKeys: already
          ? contextSelection.commandKeys.filter((k) => k !== command.key)
          : [...contextSelection.commandKeys, command.key],
      });
    } else if (e.shiftKey) {
      const anchor = lastSelectedCommandIndexRef.current ?? index;
      const from = Math.min(anchor, index);
      const to = Math.max(anchor, index);
      const rangeKeys = flatCommands.slice(from, to + 1).map((c) => c.key);
      const merged = Array.from(new Set([...contextSelection.commandKeys, ...rangeKeys]));
      setContextSelection({ ...contextSelection, commandKeys: merged });
    } else {
      setSelectedCommand(command);
      setContextSelection({ commandKeys: [command.key], parameterKeys: [] });
      lastSelectedCommandIndexRef.current = index;
    }
  };

  const handleDialogSave = (savedCommand: Command) => {
    if (!dialogCommand) {
      addCommand(savedCommand);
      setSelectedCommand(savedCommand);
    } else {
      updateCommand(savedCommand.key, savedCommand);
    }
  };

  const renderCommand = (command: Command) => {
    const subcommands = tool.commands.filter((c) => c.parentCommandKey === command.key);
    const isSelected = selectedCommand?.key === command.key;
    const isContextSelected = contextSelection.commandKeys.includes(command.key);
    const paramCount = tool.parameters.filter((p) => p.commandKey === command.key).length;

    const nameElement = (
      <span className="flex items-center gap-1.5">
        {command.name}
        {paramCount > 0 && (
          <Badge variant="secondary" className="h-4 min-w-4 px-1 text-[10px] leading-none">
            {paramCount}
          </Badge>
        )}
      </span>
    );

    const actions = (
      <CommandActions
        onEdit={() => handleEdit(command)}
        onAdd={() => handleAddSubcommand(command.key)}
        onDelete={() => deleteCommand(command.key)}
        showHandle
      />
    );

    if (subcommands.length > 0) {
      return (
        <Folder
          value={command.key}
          element={nameElement}
          isSelect={isSelected}
          className={cn(
            "group px-2 py-1.5",
            isChatOpen && isContextSelected && "ring-1 ring-primary",
          )}
          actions={actions}
          onClick={(e) => handleCommandClick(command, e)}
        >
          <Sortable
            value={subcommands}
            getItemValue={(cmd) => cmd.key}
            onValueChange={(newOrder) =>
              reorderCommands(newOrder.map((c) => c.key), command.key)
            }
          >
            <SortableContent withoutSlot>
              {subcommands.map((subcmd) => (
                <SortableItem key={subcmd.key} value={subcmd.key}>
                  {renderCommand(subcmd)}
                </SortableItem>
              ))}
            </SortableContent>
            <SortableOverlay>
              {({ value }) => {
                const cmd = tool.commands.find((c) => c.key === value);
                return (
                  <div className="rounded-md border bg-background px-2 py-1.5 text-sm">
                    {cmd?.name}
                  </div>
                );
              }}
            </SortableOverlay>
          </Sortable>
        </Folder>
      );
    }

    return (
      <File
        value={command.key}
        isSelect={isSelected}
        className={cn(
          "group w-full px-2 py-1.5",
          isChatOpen && isContextSelected && "ring-1 ring-primary",
        )}
        fileIcon={<ChevronRightIcon className="size-4 invisible" />}
        actions={actions}
        onClick={(e) => handleCommandClick(command, e)}
      >
        {nameElement}
      </File>
    );
  };

  const rootCommands = tool.commands.filter((cmd) => !cmd.parentCommandKey);
  const isRootSelected = selectedCommand === null;
  const rootParamCount = tool.parameters.filter((p) => !p.commandKey && !p.isGlobal).length;
  const globalParamCount = tool.parameters.filter((p) => p.isGlobal).length;

  const rootElement = (
    <span className="flex items-center gap-1.5">
      {tool.binaryName}
      {rootParamCount > 0 && (
        <Badge variant="secondary" className="h-4 min-w-4 px-1 text-[10px] leading-none">
          {rootParamCount}
        </Badge>
      )}
      {globalParamCount > 0 && (
        <Badge variant="outline" className="h-4 min-w-4 px-1 text-[10px] leading-none">
          {globalParamCount}
        </Badge>
      )}
    </span>
  );

  return (
    <>
      <Tree
        className="flex-1 border-r border-muted"
        initialExpandedItems={[ROOT_ID, ...rootCommands.map((c) => c.key)]}
        indicator
        sort="none"
        openIcon={<TerminalIcon className="size-4" />}
        closeIcon={<TerminalIcon className="size-4" />}
      >
        <Folder
          value={ROOT_ID}
          element={rootElement}
          isSelect={isRootSelected}
          className="group px-2 py-1.5 font-medium"
          actions={<CommandActions onAdd={() => handleAddSubcommand()} />}
          onClick={handleRootClick}
        >
          <Sortable
            value={rootCommands}
            getItemValue={(cmd) => cmd.key}
            onValueChange={(newOrder) =>
              reorderCommands(newOrder.map((c) => c.key), undefined)
            }
          >
            <SortableContent withoutSlot>
              {rootCommands.map((command) => (
                <SortableItem key={command.key} value={command.key}>
                  {renderCommand(command)}
                </SortableItem>
              ))}
            </SortableContent>
            <SortableOverlay>
              {({ value }) => {
                const cmd = tool.commands.find((c) => c.key === value);
                return (
                  <div className="rounded-md border bg-background px-2 py-1.5 text-sm">
                    {cmd?.name}
                  </div>
                );
              }}
            </SortableOverlay>
          </Sortable>
        </Folder>
      </Tree>
      <CommandDialog
        key={dialogCommand?.key ?? `new-${pendingParentKey ?? "root"}`}
        isOpen={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setDialogCommand(undefined);
            setPendingParentKey(undefined);
          }
        }}
        command={dialogCommand}
        parentKey={pendingParentKey}
        siblingKeys={tool.commands
          .filter((c) => c.parentCommandKey === pendingParentKey)
          .map((c) => c.key)}
        toolName={tool.binaryName}
        onSave={handleDialogSave}
      />
    </>
  );
}
