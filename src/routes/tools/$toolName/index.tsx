import { CommandTree } from "@/components/commandly/command-tree";
import { GeneratedCommand } from "@/components/commandly/generated-command";
import { InstallationSection } from "@/components/commandly/installation";
import { defaultComponents, ToolRenderer } from "@/components/commandly/tool-renderer";
import { Tool } from "@/components/commandly/types/tool";
import { findCommand, getDefaultCommand, slugify } from "@/components/commandly/utils/tool";
import { SavedCommandsDialog } from "@/components/tool-editor/dialogs/saved-commands-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { fetchToolDetails } from "@/lib/api/tools.api";
import {
  addSavedCommandToStorage,
  getSavedCommandsFromStorage,
  removeSavedCommandFromStorage,
} from "@/lib/editor-utils";
import { SavedCommand } from "@/lib/types";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Edit2Icon, InfoIcon, ListTreeIcon, PackageIcon, SaveIcon } from "lucide-react";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/tools/$toolName/")({
  component: RouteComponent,
  validateSearch: (search) => ({
    isLocal: search.isLocal === true,
  }),
  loaderDeps: ({ search: { isLocal } }) => ({
    isLocal,
  }),
  loader: async ({ params: { toolName }, deps: { isLocal } }) => {
    if (isLocal) {
      const localData = localStorage.getItem(`tool-${toolName}`);
      if (localData) {
        return JSON.parse(localData) as Tool;
      } else {
        return {
          binaryName: toolName,
          displayName: toolName,
          commands: [],
          parameters: [],
        } as Tool;
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
  const { isLocal } = Route.useSearch();

  const [parameterValues, setParameterValues] = useState({});
  const [savedCommands, setSavedCommands] = useState(() =>
    getSavedCommandsFromStorage(tool.binaryName),
  );
  const [savedCommandsOpen, setSavedCommandsOpen] = useState(false);
  const [treeOpen, setTreeOpen] = useState(false);
  const [installationOpen, setInstallationOpen] = useState(false);
  const hasInstallation = !!tool.installation?.sources?.length;

  const defaultCommandKey = getDefaultCommand(tool)?.key ?? "";
  const [commandKey, setCommandKey] = useQueryState("command", {
    defaultValue: defaultCommandKey,
  });

  // An empty `command` selects the tool's own parameters rather than a command's.
  const selectedCommandObject = commandKey === "" ? null : (findCommand(tool, commandKey) ?? null);

  const commandTree = (
    <CommandTree
      tool={tool}
      selectedCommand={selectedCommandObject}
      onSelectCommand={(command) => {
        setCommandKey(command?.key ?? "");
        setTreeOpen(false);
      }}
    />
  );

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
    <div className="mt-16 flex flex-col lg:h-[calc(100svh-4rem)]">
      <div className="relative mx-4 my-4 flex flex-wrap items-center gap-2 sm:mx-8 lg:shrink-0">
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
          <Sheet
            open={treeOpen}
            onOpenChange={setTreeOpen}
          >
            <SheetTrigger asChild>
              <Button
                className="relative z-10 lg:hidden"
                variant="outline"
                size="sm"
              >
                <ListTreeIcon className="mr-2 h-4 w-4" />
                Commands
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-72"
            >
              <SheetHeader>
                <SheetTitle>Commands</SheetTitle>
              </SheetHeader>
              <div className="min-h-0 flex-1">{commandTree}</div>
            </SheetContent>
          </Sheet>
          <Button
            className="relative z-10 flex gap-2"
            variant="outline"
            size="sm"
            asChild
          >
            <Link
              to="/tools/$toolName/edit"
              params={{ toolName: tool.binaryName }}
              search={{ isLocal: !!isLocal }}
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
          {hasInstallation && (
            <Dialog
              open={installationOpen}
              onOpenChange={setInstallationOpen}
            >
              <DialogTrigger asChild>
                <Button
                  className="relative z-10"
                  variant="outline"
                  size="sm"
                >
                  <PackageIcon className="mr-2 h-4 w-4" />
                  Installation
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[calc(100svh-4rem)] overflow-y-auto">
                {/* The section renders its own heading, so the dialog title is for screen readers. */}
                <DialogHeader className="sr-only">
                  <DialogTitle>Installation</DialogTitle>
                  <DialogDescription>
                    Ways to install {tool.displayName || tool.binaryName}.
                  </DialogDescription>
                </DialogHeader>
                <InstallationSection installation={tool.installation} />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
      {/*
       * On large screens the page is one viewport tall: the title row keeps its height, the grid
       * takes the rest, and each column scrolls on its own. That gives the sidebar a definite
       * height for the tree's scroll viewport to size against, and keeps a long command tree from
       * stretching the page.
       */}
      <div className="mx-auto grid w-full max-w-360 grid-cols-1 gap-6 px-4 sm:px-8 lg:min-h-0 lg:flex-1 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="hidden min-h-0 lg:block">
          <div className="flex h-full flex-col">{commandTree}</div>
        </aside>

        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
          <Card
            className="w-full"
            style={{
              viewTransitionName: `tool-card-${tool.binaryName}`,
            }}
          >
            <CardContent className="space-y-4">
              <ScrollArea className="*:data-radix-scroll-area-viewport:max-h-[calc(100vh-260px)]">
                <div className="p-4">
                  <ToolRenderer
                    selectedCommand={selectedCommandObject}
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

          <Card className="w-full">
            <GeneratedCommand
              selectedCommand={selectedCommandObject}
              tool={tool}
              parameterValues={parameterValues}
              onSaveCommand={handleSaveCommand}
            >
              <GeneratedCommand.Header>
                <GeneratedCommand.FlagFormPreference />
              </GeneratedCommand.Header>
              <CardContent className="space-y-4">
                <GeneratedCommand.Output />
                <GeneratedCommand.Actions />
              </CardContent>
            </GeneratedCommand>
          </Card>
        </div>
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
