import { Parameter, ParameterValue, Tool, Command } from "@/commandly/types/flat";
import { getCommandPath } from "@/commandly/utils/flat";
import { Button } from "@/components/ui/button";
import { TerminalIcon, CopyIcon, SaveIcon } from "lucide-react";
import { useCallback, useEffect, useState, useMemo } from "react";
import { toast } from "sonner";

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
  onSaveCommand,
}: GeneratedCommandProps) {
  selectedCommand = selectedCommand || tool.commands[0];
  const [generatedCommand, setGeneratedCommand] = useState("");

  const globalParameters = useMemo(() => {
    return tool.parameters?.filter((p) => p.isGlobal) || [];
  }, [tool]);

  const currentParameters = useMemo(() => {
    return tool?.parameters?.filter((p) => p.commandKey === selectedCommand?.key) || [];
  }, [tool, selectedCommand]);

  const generateCommand = useCallback(() => {
    if (!selectedCommand) return;
    const commandPath = getCommandPath(selectedCommand, tool);
    let command = tool.name == commandPath ? tool.name : `${tool.name} ${commandPath}`;

    const parametersWithValues: Array<{
      param: Parameter;
      value: ParameterValue;
    }> = [];

    globalParameters.forEach((param) => {
      const value = parameterValues[param.key];
      if (value !== undefined && value !== "" && value !== false) {
        parametersWithValues.push({ param, value });
      }
    });

    currentParameters.forEach((param) => {
      const value = parameterValues[param.key];
      if (value !== undefined && value !== "" && value !== false && !param.isGlobal) {
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
  }, [tool, parameterValues, selectedCommand, globalParameters, currentParameters]);

  useEffect(() => {
    generateCommand();
  }, [generateCommand]);

  const copyCommand = () => {
    navigator.clipboard.writeText(generatedCommand);
    toast("Command copied!");
  };

  return (
    <div>
      {tool.commands.length === 0 ? (
        <div className="py-8 text-center">
          <TerminalIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">No commands available for this tool.</p>
        </div>
      ) : generatedCommand ? (
        <div className="space-y-4">
          <div className="rounded bg-muted p-4 font-mono text-sm">{generatedCommand}</div>
          <div className="flex gap-2">
            <Button
              onClick={copyCommand}
              variant="outline"
              className="flex-1"
            >
              <CopyIcon className="mr-2 h-4 w-4" />
              Copy Command
            </Button>
            {onSaveCommand && (
              <Button
                onClick={() => onSaveCommand(generatedCommand)}
                variant="outline"
                className="flex-1"
              >
                <SaveIcon className="mr-2 h-4 w-4" />
                Save Command
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="py-8 text-center">
          <TerminalIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">Configure parameters to generate the command.</p>
        </div>
      )}
    </div>
  );
}
