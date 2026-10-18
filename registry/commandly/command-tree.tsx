import { Command, Tool } from "@/components/commandly/types/tool";
import {
  getCommandPath,
  getAllCommands,
  isInheritedParameter,
} from "@/components/commandly/utils/tool";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ChevronRightIcon, FolderIcon, KeyboardIcon, SearchIcon, TerminalIcon } from "lucide-react";
import { useMemo, useState } from "react";

/** The parameter-count badge shown beside a command in the tree. */
export function CountBadge({
  count,
  variant = "secondary",
}: {
  count: number;
  variant?: "secondary" | "outline";
}) {
  if (count <= 0) return null;
  return (
    <Badge
      variant={variant}
      className="h-4 min-w-4 px-1 text-[10px] leading-none"
    >
      {count}
    </Badge>
  );
}

/** A command matches on the path its result row shows, plus what it does and its other names. */
const matches = (command: Command, path: string, query: string): boolean => {
  const haystack = [path, command.description, ...(command.aliases ?? [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
};

interface CommandNodeProps {
  command: Command;
  /** How many ancestors the row is nested under; drives its indent. */
  depth: number;
  selectedCommand?: Command | null;
  onSelectCommand: (command: Command | null) => void;
}

/** One row of the tree, and for a branch command the subtree it opens. */
function CommandNode({ command, depth, selectedCommand, onSelectCommand }: CommandNodeProps) {
  const [open, setOpen] = useState(true);

  const subcommands = command.commands ?? [];
  const isSelected = selectedCommand?.key === command.key;
  const parameterCount = command.parameters?.length ?? 0;

  const rowClass = cn(
    "flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-left text-sm hover:bg-muted",
    isSelected && "bg-muted font-medium",
  );

  const label = (
    <span className="flex min-w-0 items-center gap-1.5">
      <span className="truncate">{command.displayName}</span>
      {command.interactive && (
        <KeyboardIcon
          className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400"
          aria-label="Interactive"
        />
      )}
      {parameterCount > 0 && <CountBadge count={parameterCount} />}
    </span>
  );

  if (subcommands.length === 0) {
    return (
      <button
        type="button"
        className={rowClass}
        // The indent sits on the row itself, so the whole row is the click target rather than
        // leaving an inert gutter beside it.
        style={{ paddingLeft: `${0.75 + depth * 0.75}rem` }}
        onClick={() => onSelectCommand(command)}
        title={command.description}
      >
        {label}
      </button>
    );
  }

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
    >
      <CollapsibleTrigger
        className={rowClass}
        // A branch draws a chevron before the label, so it starts half a step further in to keep
        // the labels of sibling branches and leaves on the same axis.
        style={{ paddingLeft: `${0.5 + depth * 0.75}rem` }}
        onClick={() => onSelectCommand(command)}
        title={command.description}
      >
        <ChevronRightIcon
          className={cn("size-3.5 shrink-0 transition-transform", open && "rotate-90")}
        />
        {label}
      </CollapsibleTrigger>
      <CollapsibleContent>
        {subcommands.map((subcommand) => (
          <CommandNode
            key={subcommand.key}
            command={subcommand}
            depth={depth + 1}
            selectedCommand={selectedCommand}
            onSelectCommand={onSelectCommand}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

interface CommandTreeProps {
  tool: Tool;
  selectedCommand?: Command | null;
  onSelectCommand: (command: Command | null) => void;
  className?: string;
}

export function CommandTree({
  tool,
  selectedCommand,
  onSelectCommand,
  className,
}: CommandTreeProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();

  const searchResults = useMemo(
    () =>
      normalizedQuery
        ? getAllCommands(tool).filter((command) =>
            matches(command, getCommandPath(command, tool), normalizedQuery),
          )
        : [],
    [normalizedQuery, tool],
  );

  const rootParameterCount = tool.parameters.filter((parameter) => !parameter.recursive).length;
  const inheritedParameterCount = tool.parameters.filter(isInheritedParameter).length;
  const isRootSelected = selectedCommand === null;

  return (
    // `h-full` lets a bounded parent cap the tree, so a long one scrolls here instead of
    // stretching the page.
    <div className={cn("flex h-full min-h-0 flex-col gap-2", className)}>
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search commands"
          aria-label="Search commands"
          className="pl-8"
        />
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-0.5 pb-2">
          {normalizedQuery ? (
            searchResults.length === 0 ? (
              <p className="px-2 py-4 text-sm text-muted-foreground">No command found.</p>
            ) : (
              searchResults.map((command) => (
                <button
                  key={command.key}
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-left font-mono text-sm hover:bg-muted",
                    selectedCommand?.key === command.key && "bg-muted font-medium",
                  )}
                  onClick={() => onSelectCommand(command)}
                  title={command.description}
                >
                  {getCommandPath(command, tool)}
                </button>
              ))
            )
          ) : (
            <>
              <button
                type="button"
                className={cn(
                  "flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-left font-medium hover:bg-muted",
                  isRootSelected && "bg-muted",
                )}
                onClick={() => onSelectCommand(null)}
              >
                <TerminalIcon className="size-4 shrink-0" />
                <span className="truncate">{tool.binaryName}</span>
                <CountBadge count={rootParameterCount} />
                <CountBadge
                  count={inheritedParameterCount}
                  variant="outline"
                />
              </button>
              {tool.commands.map((command) => (
                <CommandNode
                  key={command.key}
                  command={command}
                  depth={0}
                  selectedCommand={selectedCommand}
                  onSelectCommand={onSelectCommand}
                />
              ))}
            </>
          )}
        </div>
      </ScrollArea>

      {tool.commands.length > 0 && (
        <p className="flex items-center gap-1.5 border-t px-2 pt-2 text-xs text-muted-foreground">
          <FolderIcon className="size-3.5" />
          {getAllCommands(tool).length} commands
        </p>
      )}
    </div>
  );
}
