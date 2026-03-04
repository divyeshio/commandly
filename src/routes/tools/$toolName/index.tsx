import { SavedCommandsDialog } from "@/components/tool-editor-ui/dialogs/saved-commands-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { fetchToolDetails } from "@/lib/api/tools.api";
import { cn } from "@/lib/utils";
import { GeneratedCommand } from "@/registry/commandly/generated-command";
import { SavedCommand, Tool, ToolSchema } from "@/registry/commandly/lib/types/commandly";
import {
  addSavedCommandToStorage,
  defaultTool,
  getSavedCommandsFromStorage,
  removeSavedCommandFromStorage,
} from "@/registry/commandly/lib/utils/commandly";
import { RuntimePreview } from "@/registry/commandly/runtime-preview";
import { toolBuilderActions } from "@/registry/commandly/tool-editor/tool-editor.store";
import { createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { CheckIcon, ChevronsUpDownIcon, InfoIcon, SaveIcon, TerminalIcon } from "lucide-react";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { toast } from "sonner";
import { v7 as uuidv7 } from "uuid";
import z from "zod/v4";
const SearchParamsSchema = z.object({
  newTool: z.string().optional(),
});

export const Route = createFileRoute("/tools/$toolName/")({
  component: RouteComponent,
  validateSearch: zodValidator(SearchParamsSchema),
  loaderDeps: ({ search: { newTool } }) => ({
    newTool,
  }),
  loader: async ({ params: { toolName }, deps: { newTool } }) => {
    if (newTool) {
      const newToolData = localStorage.getItem(`tool-${newTool}`);
      if (newToolData) {
        const validatedTool = zodValidator(ToolSchema).parse(JSON.parse(newToolData));
        return validatedTool;
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
  const [selectedCommand, setSelectedCommand] = useQueryState("command", {
    defaultValue: tool?.commands[0].name!,
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
      key: uuidv7(),
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
    <div className="flex flex-col">
      <div className="relative mx-8 my-4 flex items-center gap-2">
        <p className="absolute left-1/2 flex -translate-x-1/2 gap-2">
          <span
            className="text-lg font-medium"
            style={{
              viewTransitionName: `tool-card-title-${tool.name}`,
            }}
          >
            {tool.displayName ? `${tool.displayName} (${tool.name})` : `${tool.name}`}
          </span>
          {tool.description && (
            <Tooltip>
              <TooltipTrigger>
                <InfoIcon className="h-3.5 w-3.5" />
              </TooltipTrigger>
              <TooltipContent>
                <span>{tool.description}</span>
              </TooltipContent>
            </Tooltip>
          )}
        </p>
        <Button
          className="relative z-10 ml-auto"
          variant="outline"
          size="sm"
          onClick={() => toolBuilderActions.setDialogOpen("savedCommands", true)}
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
                <RuntimePreview
                  selectedCommand={tool.commands.find(
                    (command) => command.name === selectedCommand,
                  )}
                  tool={tool}
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
        savedCommands={savedCommands}
        onDeleteCommand={handleDeleteCommand}
      />
    </div>
  );
}
