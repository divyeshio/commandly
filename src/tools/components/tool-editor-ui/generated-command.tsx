import { useEffect, useState } from "react";
import { TerminalIcon, CopyIcon, SaveIcon } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@tanstack/react-store";
import {
  toolBuilderSelectors,
  toolBuilderStore,
  toolBuilderActions
} from "./tool-editor.store";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { getCommandPath } from "../../lib/utils/tool-editor";
import { Parameter, ParameterValue } from "../../lib/types/tool-editor";

export function GeneratedCommand() {
  const [generatedCommand, setGeneratedCommand] = useState("");

  const selectedCommand = useStore(
    toolBuilderStore,
    (state) => state.selectedCommand
  );
  const tool = useStore(toolBuilderStore, (state) => state.tool);
  const parameterValues = useStore(
    toolBuilderStore,
    (state) => state.parameterValues
  );

  const globalParameters = useStore(toolBuilderStore, (state) =>
    toolBuilderSelectors.getGlobalParameters(state)
  );
  const currentParameters = useStore(toolBuilderStore, (state) =>
    selectedCommand?.id
      ? toolBuilderSelectors.getParametersForCommand(state, selectedCommand.id)
      : []
  );

  useEffect(() => {
    generateCommand();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tool,
    parameterValues,
    selectedCommand,
    globalParameters,
    currentParameters
  ]);

  const generateCommand = () => {
    if (!selectedCommand) return;

    const commandPath = getCommandPath(selectedCommand, tool);
    let command = commandPath;

    const parametersWithValues: Array<{
      param: Parameter;
      value: ParameterValue;
    }> = [];

    globalParameters.forEach((param) => {
      const value = parameterValues[param.id];
      if (value !== undefined && value !== "" && value !== false) {
        parametersWithValues.push({ param, value });
      }
    });

    currentParameters.forEach((param) => {
      const value = parameterValues[param.id];
      if (value !== undefined && value !== "" && value !== false) {
        parametersWithValues.push({ param, value });
      }
    });

    const positionalParams = parametersWithValues
      .filter(({ param }) => param.parameterType === "Argument")
      .sort((a, b) => (a.param.position || 0) - (b.param.position || 0));

    parametersWithValues.forEach(({ param, value }) => {
      if (param.parameterType === "Flag") {
        if (value === true) {
          const flag = param.shortFlag || param.longFlag;
          if (flag) command += ` ${flag}`;
        }
      } else if (param.parameterType === "Option") {
        const flag = param.shortFlag || param.longFlag;
        if (flag) {
          const separator = param.keyValueSeparator ?? " ";
          command += ` ${flag}${separator}${value}`;
        }
      } else if (param.parameterType === "Argument") {
        command += ` ${value}`;
      }
    });

    positionalParams.forEach(({ value }) => {
      command += ` ${value}`;
    });

    setGeneratedCommand(command);
  };

  const copyCommand = () => {
    navigator.clipboard.writeText(generatedCommand);
    toast("Command copied!");
  };

  const saveCommand = () => {
    if (!generatedCommand.trim()) {
      toast("No command to save");
      return;
    }

    toolBuilderActions.addSavedCommand(generatedCommand);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TerminalIcon className="h-5 w-5" />
            Generated Command
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {tool.commands.length === 0 ? (
            <div className="text-center py-8">
              <TerminalIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No commands available for this tool.
              </p>
            </div>
          ) : generatedCommand ? (
            <>
              <div className="bg-muted p-4 rounded font-mono text-sm">
                {generatedCommand}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={copyCommand}
                  variant="outline"
                  className="flex-1"
                >
                  <CopyIcon className="h-4 w-4 mr-2" />
                  Copy Command
                </Button>
                <Button
                  onClick={saveCommand}
                  variant="outline"
                  className="flex-1"
                >
                  <SaveIcon className="h-4 w-4 mr-2" />
                  Save Command
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <TerminalIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Configure parameters to generate the command.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
