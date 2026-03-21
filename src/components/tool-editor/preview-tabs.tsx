import { HelpMenu } from "./help-menu";
import { useToolBuilder } from "./tool-editor.context";
import { GeneratedCommand } from "@/commandly/generated-command";
import { JsonOutput } from "@/commandly/json-output";
import { ToolRenderer } from "@/commandly/tool-renderer";
import { Tool } from "@/commandly/types/flat";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TerminalIcon, WandSparklesIcon } from "lucide-react";
import { useState } from "react";

interface PreviewTabsProps {
  onSaveCommand?: (command: string) => void;
  streamingTool?: Tool | null;
  isAIGenerating?: boolean;
}

export function PreviewTabs({ onSaveCommand, streamingTool, isAIGenerating }: PreviewTabsProps) {
  const [currentTab, setActiveTab] = useState("ui");

  const { selectedCommand, tool, parameterValues, setParameterValue, initializeTool } =
    useToolBuilder();
  const displayTool = streamingTool ?? tool;

  return (
    <div className="flex h-full max-w-full flex-col">
      <Tabs
        value={currentTab}
        onValueChange={setActiveTab}
        className="flex h-full w-full flex-col"
      >
        <div className="relative mx-auto flex w-fit items-center gap-2">
          <TabsList className="flex w-fit justify-center">
            <TabsTrigger value="json">Json</TabsTrigger>
            <TabsTrigger value="ui">Preview</TabsTrigger>
            <TabsTrigger value="help">Help</TabsTrigger>
          </TabsList>
          {isAIGenerating && <WandSparklesIcon className="h-4 w-4 animate-pulse text-purple-500" />}
        </div>
        <div className="relative min-h-0 flex-1">
          <TabsContent
            value="json"
            className="absolute inset-0 flex flex-col"
          >
            {streamingTool ? (
              <>
                <div className="shrink-0 border-b p-2">
                  <Badge
                    variant="secondary"
                    className="text-xs"
                  >
                    AI preview — not yet applied
                  </Badge>
                </div>
                <ScrollArea className="min-h-0 flex-1">
                  <div className="p-2">
                    <JsonOutput tool={streamingTool} />
                  </div>
                </ScrollArea>
              </>
            ) : (
              <JsonOutput
                tool={tool}
                onApply={initializeTool}
              />
            )}
          </TabsContent>
          <TabsContent
            value="ui"
            className="absolute inset-0 flex flex-col gap-2 p-1"
          >
            <Card className="flex min-h-0 flex-1 flex-col">
              <CardHeader hidden={true}>
                <CardDescription hidden={true}></CardDescription>
                <CardTitle>Runtime Preview</CardTitle>
              </CardHeader>
              <CardContent className="min-h-0 flex-1 p-0">
                <ScrollArea className="h-full">
                  <div className="space-y-4 p-6">
                    <ToolRenderer
                      selectedCommand={selectedCommand}
                      tool={displayTool}
                      parameterValues={parameterValues}
                      updateParameterValue={(key, value) => setParameterValue(key, value)}
                    />
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <div className="shrink-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TerminalIcon className="h-5 w-5" />
                    Generated Command
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <GeneratedCommand
                    tool={tool}
                    parameterValues={parameterValues}
                    onSaveCommand={onSaveCommand}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent
            value="help"
            className="absolute inset-0 overflow-y-auto"
          >
            <Card className="rounded-xl p-0">
              <CardHeader hidden={true}>
                <CardDescription hidden={true}>
                  Get help with using this tool and its features.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <HelpMenu />
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
