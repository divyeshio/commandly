import { CommandDialog } from "../tool-editor/dialogs/command-dialog";
import { useToolBuilder } from "./tool-editor.context";
import { CountBadge } from "@/components/commandly/command-tree";
import { Command } from "@/components/commandly/types/tool";
import { findCommand, isInheritedParameter } from "@/components/commandly/utils/tool";
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
import {
  ChevronRightIcon,
  Edit2Icon,
  GripVerticalIcon,
  KeyboardIcon,
  PlusIcon,
  TerminalIcon,
  Trash2Icon,
} from "lucide-react";
import { useRef, useState } from "react";

const ROOT_ID = "__root__";

function CommandActions({
  label,
  onEdit,
  onAdd,
  onDelete,
  showHandle = false,
}: {
  label: string;
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
            aria-label={`Reorder ${label}`}
          >
            <GripVerticalIcon className="h-3 w-3" />
          </Button>
        </SortableItemHandle>
      )}
      {onEdit && (
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
          aria-label={`Edit ${label}`}
          onClick={onEdit}
        >
          <Edit2Icon className="h-3 w-3" />
        </Button>
      )}
      <Button
        variant="ghost"
        size="sm"
        className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
        aria-label={`Add subcommand to ${label}`}
        onClick={onAdd}
      >
        <PlusIcon className="h-3 w-3" />
      </Button>
      {onDelete && (
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
          aria-label={`Delete ${label}`}
          onClick={onDelete}
        >
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
    setSelectedCommandKey,
    setContextSelection,
    updateCommand,
    deleteCommand,
    reorderCommands,
  } = useToolBuilder();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogCommand, setDialogCommand] = useState<Command | undefined>(undefined);
  const [pendingParentKey, setPendingParentKey] = useState<string | undefined>(undefined);

  const lastSelectedCommandIndexRef = useRef<number | null>(null);

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
    setSelectedCommandKey(null);
    setContextSelection({ commandKeys: [], parameterRefs: [] });
  };

  const handleCommandClick = (command: Command, siblings: Command[], e: React.MouseEvent) => {
    e.stopPropagation();
    const index = siblings.findIndex((c) => c.key === command.key);

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
      const rangeKeys = siblings.slice(from, to + 1).map((c) => c.key);
      const merged = Array.from(new Set([...contextSelection.commandKeys, ...rangeKeys]));
      setContextSelection({ ...contextSelection, commandKeys: merged });
    } else {
      setSelectedCommandKey(command.key);
      setContextSelection({ commandKeys: [command.key], parameterRefs: [] });
      lastSelectedCommandIndexRef.current = index;
    }
  };

  const handleDialogSave = (savedCommand: Command) => {
    if (!dialogCommand) {
      addCommand(savedCommand, pendingParentKey ?? null);
      setSelectedCommandKey(savedCommand.key);
    } else {
      updateCommand(dialogCommand.key, savedCommand);
    }
  };

  const renderCommand = (command: Command, siblings: Command[]) => {
    const subcommands = command.commands ?? [];
    const isSelected = selectedCommand?.key === command.key;
    const isContextSelected = contextSelection.commandKeys.includes(command.key);
    const paramCount = command.parameters?.length ?? 0;

    const nameElement = (
      <span className="flex items-center gap-1.5">
        {command.displayName}
        {command.interactive && (
          <KeyboardIcon
            className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400"
            aria-label="Interactive"
          />
        )}
        {command.aliases?.map((alias) => (
          <span
            key={alias}
            className="font-mono text-[10px] text-muted-foreground"
          >
            {alias}
          </span>
        ))}
        {paramCount > 0 && <CountBadge count={paramCount} />}
      </span>
    );

    const actions = (
      <CommandActions
        label={command.displayName}
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
          onClick={(e) => handleCommandClick(command, siblings, e)}
        >
          <Sortable
            value={subcommands}
            getItemValue={(cmd) => cmd.key}
            onValueChange={(newOrder) =>
              reorderCommands(
                newOrder.map((c) => c.key),
                command.key,
              )
            }
          >
            <SortableContent withoutSlot>
              {subcommands.map((subcmd) => (
                <SortableItem
                  key={subcmd.key}
                  value={subcmd.key}
                >
                  {renderCommand(subcmd, subcommands)}
                </SortableItem>
              ))}
            </SortableContent>
            <SortableOverlay>
              {({ value }) => {
                const cmd = findCommand(tool, String(value));
                return (
                  <div className="rounded-md border bg-background px-2 py-1.5 text-sm">
                    {cmd?.displayName}
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
        fileIcon={<ChevronRightIcon className="invisible size-4" />}
        actions={actions}
        onClick={(e) => handleCommandClick(command, siblings, e)}
      >
        {nameElement}
      </File>
    );
  };

  const rootCommands = tool.commands;
  const isRootSelected = selectedCommand === null;
  const rootParamCount = tool.parameters.filter((p) => !p.recursive).length;
  const inheritedParamCount = tool.parameters.filter(isInheritedParameter).length;

  const rootElement = (
    <span className="flex items-center gap-1.5">
      {tool.binaryName}
      <CountBadge count={rootParamCount} />
      <CountBadge
        count={inheritedParamCount}
        variant="outline"
      />
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
          hasChildren={rootCommands.length > 0}
          actions={
            <CommandActions
              label={tool.binaryName}
              onAdd={() => handleAddSubcommand()}
            />
          }
          onClick={handleRootClick}
        >
          <Sortable
            value={rootCommands}
            getItemValue={(cmd) => cmd.key}
            onValueChange={(newOrder) =>
              reorderCommands(
                newOrder.map((c) => c.key),
                null,
              )
            }
          >
            <SortableContent withoutSlot>
              {rootCommands.map((command) => (
                <SortableItem
                  key={command.key}
                  value={command.key}
                >
                  {renderCommand(command, rootCommands)}
                </SortableItem>
              ))}
            </SortableContent>
            <SortableOverlay>
              {({ value }) => {
                const cmd = findCommand(tool, String(value));
                return (
                  <div className="rounded-md border bg-background px-2 py-1.5 text-sm">
                    {cmd?.displayName}
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
        siblingKeys={
          pendingParentKey
            ? (findCommand(tool, pendingParentKey)?.commands ?? []).map((c) => c.key)
            : tool.commands.map((c) => c.key)
        }
        toolName={tool.binaryName}
        onSave={handleDialogSave}
      />
    </>
  );
}
