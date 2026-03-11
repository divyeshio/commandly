import { GeneratedCommand } from "../generated-command";
import { JsonOutput } from "../json-output";
import { RuntimePreview } from "../runtime-preview";
import { HelpMenu } from "./help-menu";
import { useToolBuilder } from "./tool-editor.context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TerminalIcon } from "lucide-react";
import { useState } from "react";

interface PreviewTabsProps {
  onSaveCommand?: (command: string) => void;
}

export function PreviewTabs({ onSaveCommand }: PreviewTabsProps) {
  const [currentTab, setActiveTab] = useState("ui");

  const { selectedCommand, tool, parameterValues, setParameterValue } = useToolBuilder();

  return (
    <div className="flex h-full max-w-full justify-center rounded-xl">
      <Tabs
        value={currentTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="mx-auto flex w-fit justify-center">
          <TabsTrigger value="json">Json</TabsTrigger>
          <TabsTrigger value="ui">Preview</TabsTrigger>
          <TabsTrigger value="help">Help</TabsTrigger>
        </TabsList>
        <TabsContent value="json">
          <JsonOutput tool={tool} />
        </TabsContent>
        <TabsContent
          value="ui"
          className="flex flex-col gap-4"
        >
          <Card>
            <CardHeader hidden={true}>
              <CardDescription hidden={true}></CardDescription>
              <CardTitle>Runtime Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RuntimePreview
                selectedCommand={selectedCommand}
                tool={tool}
                parameterValues={parameterValues}
                updateParameterValue={(key, value) => setParameterValue(key, value)}
              />
            </CardContent>
          </Card>

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
        </TabsContent>
        <TabsContent value="help">
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
      </Tabs>
    </div>
  );
}
