import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HelpMenu } from "./help-menu";
import { useQueryState } from "nuqs";
import { useStore } from "@tanstack/react-store";
import { toolBuilderStore, toolBuilderActions } from "./tool-editor.store";
import { RuntimePreview } from "../runtime-preview";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { ParameterValue } from "@/registry/commandly/lib/types/commandly";
import { TerminalIcon } from "lucide-react";
import { JsonOutput } from "../json-output";
import { GeneratedCommand } from "../generated-command";

export function PreviewTabs() {
  const [currentTab, setActiveTab] = useQueryState("tab", {
    defaultValue: "ui"
  });

  const selectedCommand = useStore(
    toolBuilderStore,
    (state) => state.selectedCommand
  );
  const tool = useStore(toolBuilderStore, (state) => state.tool);
  const parameterValues = useStore(
    toolBuilderStore,
    (state) => state.parameterValues
  );
  const updateParameterValue = (parameterId: string, value: ParameterValue) => {
    toolBuilderStore.setState((state) => ({
      ...state,
      parameterValues: {
        ...state.parameterValues,
        [parameterId]: value as ParameterValue
      }
    }));
  };

  const handleSaveCommand = (command: string) => {
    toolBuilderActions.addSavedCommand(command);
  };

  return (
    <div className="h-full rounded-xl flex justify-center max-w-full">
      <Tabs value={currentTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex justify-center w-fit mx-auto">
          <TabsTrigger value="json">Json</TabsTrigger>
          <TabsTrigger value="ui">Preview</TabsTrigger>
          <TabsTrigger value="help">Help</TabsTrigger>
        </TabsList>
        <TabsContent value="json">
          <JsonOutput tool={tool} />
        </TabsContent>
        <TabsContent value="ui" className="flex flex-col gap-4">
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
                updateParameterValue={updateParameterValue}
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
                onSaveCommand={handleSaveCommand}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="help">
          <Card className="p-0 rounded-xl">
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
