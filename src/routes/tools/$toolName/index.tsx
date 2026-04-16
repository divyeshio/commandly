import { GeneratedCommand } from "@/components/commandly/generated-command";
import { defaultComponents, ToolRenderer } from "@/components/commandly/tool-renderer";
import { Tool } from "@/components/commandly/types/flat";
import { slugify } from "@/components/commandly/utils/flat";
import { SavedCommandsDialog } from "@/components/tool-editor/dialogs/saved-commands-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { fetchToolDetails } from "@/lib/api/tools.api";
import {
  addSavedCommandToStorage,
  getSavedCommandsFromStorage,
  removeSavedCommandFromStorage,
} from "@/lib/editor-utils";
import { SavedCommand } from "@/lib/types";
import { cn, defaultTool } from "@/lib/utils";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CheckIcon,
  ChevronsUpDownIcon,
  Edit2Icon,
  InfoIcon,
  SaveIcon,
  TerminalIcon,
} from "lucide-react";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/tools/$toolName/")({
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

  const [parameterValues, setParameterValues] = useState({});
  const [savedCommands, setSavedCommands] = useState(() => {
    if (!tool) return [];
    const toolId = tool.binaryName;
    return getSavedCommandsFromStorage(toolId);
  });
  const [open, setOpen] = useState(false);
  const [savedCommandsOpen, setSavedCommandsOpen] = useState(false);
  const hasUncategorizedParams =
    tool?.parameters.some((p) => !p.commandKey && !p.isGlobal) ?? false;

  const getCommandDepth = (key: string, depth = 0): number => {
    const cmd = tool?.commands.find((c) => c.key === key);
    if (!cmd?.parentCommandKey) return depth;
    return getCommandDepth(cmd.parentCommandKey, depth + 1);
  };

  const getCommandLabel = (name: string): string => {
    const cmd = tool?.commands.find((c) => c.name === name);
    if (!cmd?.parentCommandKey) return name;
    const parent = tool?.commands.find((c) => c.key === cmd.parentCommandKey);
    return parent ? `${getCommandLabel(parent.name)} / ${name}` : name;
  };

  const defaultCommandName = tool?.commands?.[0]?.name ?? "";
  const [selectedCommand, setSelectedCommand] = useQueryState("command", {
    defaultValue: defaultCommandName,
  });

  if (!tool) return <div>Tool not found.</div>;

  const handleSaveCommand = (command: string) => {
    const toolId = tool.binaryName;
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

    toast("Command Saved", {
      description: "Command has been successfully saved.",
    });
  };

  const handleDeleteCommand = (commandKey: string) => {
    if (!tool) return;
    const toolId = tool.binaryName;
    removeSavedCommandFromStorage(toolId, commandKey);
    setSavedCommands(getSavedCommandsFromStorage(toolId));
  };

  return (
    <div className="mt-16 flex flex-col">
      <div className="relative mx-4 my-4 flex flex-wrap items-center gap-2 sm:mx-8">
        <p className="flex gap-2 sm:absolute sm:left-1/2 sm:-translate-x-1/2">
          <span
            className="font-mono text-base font-medium sm:text-lg"
            style={{
              viewTransitionName: `tool-card-title-${tool.binaryName}`,
            }}
          >
            {tool.displayName ? `${tool.displayName} (${tool.binaryName})` : `${tool.binaryName}`}
          </span>
          {tool.info?.description && (
            <Tooltip>
              <TooltipTrigger>
                <InfoIcon className="h-3.5 w-3.5" />
              </TooltipTrigger>
              <TooltipContent>
                <span>{tool.info?.description}</span>
              </TooltipContent>
            </Tooltip>
          )}
        </p>
        <div className="flex flex-wrap gap-2 sm:ml-auto">
        <Button
          className="relative z-10 flex gap-2"
          variant="outline"
          size="sm"
          asChild
        >
          <Link
            to="/tools/$toolName/edit"
            params={{ toolName: tool.binaryName }}
            search={{ isLocal: !!newTool }}
          >
            <Edit2Icon className="h-4 w-4" />
            Edit
          </Link>
        </Button>
        <Button
          className="relative z-10"
          variant="outline"
          size="sm"
          onClick={() => setSavedCommandsOpen(true)}
        >
          <SaveIcon className="mr-2 h-4 w-4" />
          Saved Commands
        </Button>
        </div>
      </div>
      <div className="flex w-full flex-col items-center justify-center gap-8 px-4 lg:flex-row lg:items-start lg:gap-16">
        <Card
          className="w-full max-w-4xl lg:w-2xl"
          style={{
            viewTransitionName: `tool-card-${tool.binaryName}`,
          }}
        >
          <CardHeader>
            <CardDescription hidden={true}></CardDescription>
            <CardTitle className="flex items-center gap-2">
              {(tool.commands.length > 0 || hasUncategorizedParams) && (
                <div className="flex items-center gap-4">
                  <span className="text-sm">Command</span>
                  <Popover
                    open={open}
                    onOpenChange={setOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-48 justify-between"
                      >
                        <span className="truncate">
                          {selectedCommand === ""
                            ? tool.binaryName
                            : getCommandLabel(selectedCommand)}
                        </span>
                        <ChevronsUpDownIcon className="opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-0">
                      <Command>
                        <CommandList>
                          {hasUncategorizedParams && (
                            <CommandGroup>
                              <CommandItem
                                key="__none__"
                                value=""
                                onSelect={() => {
                                  setSelectedCommand("");
                                  setOpen(false);
                                }}
                              >
                                <span className="font-mono">{tool.binaryName}</span>
                                <CheckIcon
                                  className={cn(
                                    "ml-auto h-4 w-4",
                                    selectedCommand === "" ? "opacity-100" : "opacity-0",
                                  )}
                                />
                              </CommandItem>
                            </CommandGroup>
                          )}
                          {hasUncategorizedParams && tool.commands.length > 0 && (
                            <CommandSeparator />
                          )}
                          {tool.commands.length > 0 && (
                            <CommandGroup>
                              {tool.commands.map((option) => {
                                const depth = getCommandDepth(option.key);
                                return (
                                  <CommandItem
                                    key={option.key}
                                    value={option.name}
                                    onSelect={(currentValue) => {
                                      setSelectedCommand(currentValue);
                                      setOpen(false);
                                    }}
                                    style={{ paddingLeft: `${0.5 + depth * 1.25}rem` }}
                                  >
                                    {option.name}
                                    <CheckIcon
                                      className={cn(
                                        "ml-auto h-4 w-4",
                                        selectedCommand === option.name
                                          ? "opacity-100"
                                          : "opacity-0",
                                      )}
                                    />
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScrollArea className="*:data-radix-scroll-area-viewport:max-h-[calc(100vh-260px)]">
              <div className="p-4">
                <ToolRenderer
                  selectedCommand={
                    selectedCommand === ""
                      ? null
                      : tool.commands.find((command) => command.name === selectedCommand)
                  }
                  tool={tool}
                  catalog={defaultComponents()}
                  parameterValues={parameterValues}
                  updateParameterValue={(parameterId, value) =>
                    setParameterValues((prev) => ({
                      ...prev,
                      [parameterId]: value,
                    }))
                  }
                />
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="w-full max-w-full lg:h-full lg:w-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TerminalIcon className="h-5 w-5" />
              Generated Command
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <GeneratedCommand
              selectedCommand={
                selectedCommand === ""
                  ? null
                  : tool.commands.find((command) => command.name === selectedCommand)
              }
              tool={tool}
              parameterValues={parameterValues}
              onSaveCommand={handleSaveCommand}
            />
          </CardContent>
        </Card>
      </div>
      <SavedCommandsDialog
        open={savedCommandsOpen}
        onOpenChange={setSavedCommandsOpen}
        savedCommands={savedCommands}
        onDeleteCommand={handleDeleteCommand}
      />
    </div>
  );
}
