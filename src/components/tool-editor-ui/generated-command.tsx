import { useEffect, useState, useMemo } from "react";
import { TerminalIcon, CopyIcon, SaveIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getCommandPath } from "@/lib/utils/tool-editor";
import {
  Parameter,
  ParameterValue,
  Tool,
  Command
} from "@/lib/types/tool-editor";

interface GeneratedCommandProps {
  tool: Tool;
  selectedCommand?: Command;
  parameterValues: Record<string, ParameterValue>;
  onSaveCommand?: (command: string) => void;
}

export function GeneratedCommand({
  tool,
  selectedCommand,
  parameterValues,
  onSaveCommand
}: GeneratedCommandProps) {
  selectedCommand = selectedCommand || tool.commands[0];
  const [generatedCommand, setGeneratedCommand] = useState("");

  const globalParameters = useMemo(() => {
    return tool.parameters?.filter((p) => p.isGlobal) || [];
  }, [tool]);

  const currentParameters = useMemo(() => {
    return (
      tool?.parameters?.filter((p) => p.commandId === selectedCommand.id) || []
    );
  }, [tool, selectedCommand]);

  useEffect(() => {
    generateCommand();
  }, [tool, parameterValues, selectedCommand]);

  const generateCommand = () => {
    const commandPath = getCommandPath(selectedCommand, tool);
    let command =
      tool.name == commandPath ? tool.name : `${tool.name} ${commandPath}`;

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
      if (
        value !== undefined &&
        value !== "" &&
        value !== false &&
        !param.isGlobal
      ) {
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

  return (
    <div>
      {tool.commands.length === 0 ? (
        <div className="text-center py-8">
          <TerminalIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            No commands available for this tool.
          </p>
        </div>
      ) : generatedCommand ? (
        <div className="space-y-4">
          <div className="bg-muted p-4 rounded font-mono text-sm">
            {generatedCommand}
          </div>
          <div className="flex gap-2">
            <Button onClick={copyCommand} variant="outline" className="flex-1">
              <CopyIcon className="h-4 w-4 mr-2" />
              Copy Command
            </Button>
            {onSaveCommand && (
              <Button
                onClick={() => onSaveCommand(generatedCommand)}
                variant="outline"
                className="flex-1"
              >
                <SaveIcon className="h-4 w-4 mr-2" />
                Save Command
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <TerminalIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Configure parameters to generate the command.
          </p>
        </div>
      )}
    </div>
  );
}
