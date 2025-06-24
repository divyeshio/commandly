import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { HelpMenu } from "./help-menu";
import { useQueryState } from "nuqs";
import { useStore } from "@tanstack/react-store";
import {
  toolBuilderSelectors,
  toolBuilderStore
} from "@/components/tool-editor-ui/tool-editor.store";
import { RuntimePreview } from "./runtime-preview";
import { GeneratedCommand } from "./generated-command";
import { JsonOutput } from "./json-output";

export function PreviewTabs() {
  const [currentTab, setActiveTab] = useQueryState("tab", {
    defaultValue: "ui"
  });

  const selectedCommand = useStore(
    toolBuilderStore,
    (state) => state.selectedCommand
  );
  const tool = useStore(toolBuilderStore, (state) => state.tool);

  const globalParameters = useStore(toolBuilderStore, (state) =>
    toolBuilderSelectors.getGlobalParameters(state)
  );
  const currentParameters = useStore(toolBuilderStore, (state) =>
    selectedCommand?.id
      ? toolBuilderSelectors.getParametersForCommand(state, selectedCommand.id)
      : []
  );

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
          <RuntimePreview
            selectedCommand={selectedCommand}
            tool={tool}
            globalParameters={globalParameters}
            currentParameters={currentParameters}
          />
          <GeneratedCommand />
        </TabsContent>
        <TabsContent value="help">
          <HelpMenu />
        </TabsContent>
      </Tabs>
    </div>
  );
}
