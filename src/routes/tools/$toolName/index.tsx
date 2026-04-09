import { GeneratedCommand } from "@/components/commandly/generated-command";
import { defaultComponents, ToolRenderer } from "@/components/commandly/tool-renderer";
import { Tool } from "@/components/commandly/types/flat";
import { slugify } from "@/components/commandly/utils/flat";
import { SavedCommandsDialog } from "@/components/tool-editor/dialogs/saved-commands-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
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
import { createFileRoute } from "@tanstack/react-router";
import { CheckIcon, ChevronsUpDownIcon, InfoIcon, SaveIcon, TerminalIcon } from "lucide-react";
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

  const [parameterValues, setParameterValues] = useState({});
  const [savedCommands, setSavedCommands] = useState(() => {
    if (!tool) return [];
    const toolId = tool.name;
    return getSavedCommandsFromStorage(toolId);
  });
  const [open, setOpen] = useState(false);
  const [savedCommandsOpen, setSavedCommandsOpen] = useState(false);
  const defaultCommandName = tool?.commands?.[0]?.name ?? "";
  const [selectedCommand, setSelectedCommand] = useQueryState("command", {
    defaultValue: defaultCommandName,
  });

  if (!tool) return <div>Tool not found.</div>;

  const handleSaveCommand = (command: string) => {
    const toolId = tool.name;
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

    toast("Command Saved", {
      description: "Command has been successfully saved.",
    });
  };

  const handleDeleteCommand = (commandKey: string) => {
    if (!tool) return;
    const toolId = tool.name;
    removeSavedCommandFromStorage(`saved-${toolId}`, commandKey);
    setSavedCommands(getSavedCommandsFromStorage(toolId));
  };

  return (
    <div className="mt-16 flex flex-col">
      <div className="relative mx-8 my-4 flex items-center gap-2">
        <p className="absolute left-1/2 flex -translate-x-1/2 gap-2">
          <span
            className="font-mono text-lg font-medium"
            style={{
              viewTransitionName: `tool-card-title-${tool.name}`,
            }}
          >
            {tool.displayName ? `${tool.displayName} (${tool.name})` : `${tool.name}`}
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
        <Button
          className="relative z-10 ml-auto"
          variant="outline"
          size="sm"
          onClick={() => setSavedCommandsOpen(true)}
        >
          <SaveIcon className="mr-2 h-4 w-4" />
          Saved Commands
        </Button>
      </div>
      <div className="align-center flex w-full justify-center gap-16 px-4">
        <Card
          className="w-2xl max-w-4xl"
          style={{
            viewTransitionName: `tool-card-${tool.name}`,
          }}
        >
          <CardHeader>
            <CardDescription hidden={true}></CardDescription>
            <CardTitle className="flex items-center gap-2">
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
                      {tool.commands.find((command) => command.name === selectedCommand)?.name}
                      <ChevronsUpDownIcon className="opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-0">
                    <Command>
                      <CommandList>
                        <CommandGroup>
                          {tool.commands.map((option) => (
                            <CommandItem
                              key={option.key}
                              value={option.name}
                              onSelect={(currentValue) => {
                                setSelectedCommand(currentValue);
                                setOpen(false);
                              }}
                            >
                              {option.name}
                              <CheckIcon
                                className={cn(
                                  "ml-auto h-4 w-4",
                                  selectedCommand === option.name ? "opacity-100" : "opacity-0",
                                )}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScrollArea className="*:data-radix-scroll-area-viewport:max-h-[calc(100vh-260px)]">
              <div className="p-4">
                <ToolRenderer
                  selectedCommand={tool.commands.find(
                    (command) => command.name === selectedCommand,
                  )}
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

        <Card className="h-full w-3xl max-w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TerminalIcon className="h-5 w-5" />
              Generated Command
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <GeneratedCommand
              selectedCommand={tool.commands.find((command) => command.name === selectedCommand)}
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
