import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InfoIcon } from "lucide-react";
import { Parameter, ParameterValue } from "@/lib/types/tool-editor";
import { Command, Tool } from "@/lib/types/tool-editor";
import { useStore } from "@tanstack/react-store";
import { toolBuilderStore } from "@/components/tool-editor-ui/tool-editor.store";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

const findDefaultCommand = (tool: Tool): Command | null => {
  const defaultCommand = tool.commands.find((command) => command.isDefault);
  if (defaultCommand) return defaultCommand;

  const nameMatchCommand = tool.commands.find(
    (command) => command.name.toLowerCase() === tool.name.toLowerCase()
  );
  if (nameMatchCommand) return nameMatchCommand;

  return tool.commands.length > 0 ? tool.commands[0] : null;
};

interface RuntimePreviewProps {
  selectedCommand?: Command | null;
  tool: Tool;
  globalParameters: Parameter[];
  currentParameters: Parameter[];
}

export function RuntimePreview({
  selectedCommand: providedCommand,
  tool,
  globalParameters,
  currentParameters,
}: RuntimePreviewProps) {
  const parameterValues = useStore(
    toolBuilderStore,
    (state) => state.parameterValues
  );

  const updateParameterValue = (parameterId: string, value: ParameterValue) => {
    toolBuilderStore.setState((state) => ({
      ...state,
      parameterValues: {
        ...state.parameterValues,
        [parameterId]: value,
      },
    }));
  };

  const selectedCommand = providedCommand ?? findDefaultCommand(tool);

  useEffect(() => {
    if (!providedCommand && selectedCommand) {
      if (selectedCommand.isDefault) {
      } else if (
        selectedCommand.name.toLowerCase() === tool.name.toLowerCase()
      ) {
      } else {
      }
    }
  }, [providedCommand, selectedCommand, tool.name]);

  const renderParameterInput = (parameter: Parameter) => {
    const value = parameterValues[parameter.id] || parameter.defaultValue || "";

    switch (parameter.parameterType) {
      case "Flag":
        return (
          <div key={parameter.id} className="flex items-center space-x-2">
            <Switch
              checked={(parameterValues[parameter.id] as boolean) || false}
              onCheckedChange={(checked) =>
                updateParameterValue(parameter.id, checked)
              }
            />
            <Label className="flex-1">
              {parameter.name}
              {parameter.isRequired && (
                <span className="text-destructive ml-1">*</span>
              )}
              <Tooltip>
                <TooltipTrigger>
                  <InfoIcon className="h-3.5 w-3.5" />
                </TooltipTrigger>
                <TooltipContent>
                  <span>{parameter.description}</span>
                </TooltipContent>
              </Tooltip>
            </Label>
            {parameter.isGlobal && (
              <Badge variant="outline" className="text-xs">
                global
              </Badge>
            )}
          </div>
        );

      case "Option":
        if (parameter.dataType === "Enum") {
          return (
            <div key={parameter.id} className="space-y-2">
              <Label>
                {parameter.name}
                {parameter.isRequired && (
                  <span className="text-destructive ml-1">*</span>
                )}
                <Tooltip>
                  <TooltipTrigger>
                    <InfoIcon className="h-3.5 w-3.5" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <span>{parameter.description}</span>
                  </TooltipContent>
                </Tooltip>
                {parameter.isGlobal && (
                  <Badge variant="outline" className="text-xs ml-2">
                    global
                  </Badge>
                )}
              </Label>
              <Select
                value={value as string}
                onValueChange={(newValue) =>
                  updateParameterValue(parameter.id, newValue)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  {parameter.enumValues.map((enumValue) => (
                    <SelectItem key={enumValue.id} value={enumValue.value}>
                      {enumValue.displayName || enumValue.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        } else if (parameter.dataType === "Boolean") {
          return (
            <div key={parameter.id} className="flex items-center space-x-2">
              <Switch
                checked={value === "true" || value === true}
                onCheckedChange={(checked) =>
                  updateParameterValue(parameter.id, checked.toString())
                }
              />
              <Label className="flex-1">
                {parameter.name}
                {parameter.isRequired && (
                  <span className="text-destructive ml-1">*</span>
                )}
                <Tooltip>
                  <TooltipTrigger>
                    <InfoIcon className="h-3.5 w-3.5" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <span>{parameter.description}</span>
                  </TooltipContent>
                </Tooltip>
              </Label>
              {parameter.isGlobal && (
                <Badge variant="outline" className="text-xs">
                  global
                </Badge>
              )}
            </div>
          );
        } else {
          return (
            <div key={parameter.id} className="space-y-2">
              <Label>
                {parameter.name}
                {parameter.isRequired && (
                  <span className="text-destructive ml-1">*</span>
                )}
                <Tooltip>
                  <TooltipTrigger>
                    <InfoIcon className="h-3.5 w-3.5" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <span>{parameter.description}</span>
                  </TooltipContent>
                </Tooltip>
                {parameter.isGlobal && (
                  <Badge variant="outline" className="text-xs ml-2">
                    global
                  </Badge>
                )}
              </Label>
              <Input
                type={parameter.dataType === "Number" ? "number" : "text"}
                value={
                  parameter.dataType == "Number"
                    ? (value as number)
                    : (value as string)
                }
                onChange={(e) =>
                  updateParameterValue(parameter.id, e.target.value)
                }
                placeholder="Enter value"
              />
            </div>
          );
        }

      case "Argument":
        return (
          <div key={parameter.id} className="space-y-2">
            <Label>
              {parameter.name}
              {parameter.isRequired && (
                <span className="text-destructive ml-1">*</span>
              )}
              <Tooltip>
                <TooltipTrigger>
                  <InfoIcon className="h-3.5 w-3.5" />
                </TooltipTrigger>
                <TooltipContent>
                  <span>{parameter.description}</span>
                </TooltipContent>
              </Tooltip>
              <Badge variant="secondary" className="text-xs ml-2">
                {parameter.parameterType}
                {parameter.parameterType === "Argument" &&
                  parameter.position !== undefined &&
                  ` (${parameter.position})`}
              </Badge>
            </Label>
            <Input
              type={parameter.dataType === "Number" ? "number" : "text"}
              value={
                parameter.dataType == "Number"
                  ? (value as number)
                  : (value as string)
              }
              onChange={(e) =>
                updateParameterValue(parameter.id, e.target.value)
              }
              placeholder="Enter value"
            />
          </div>
        );

      default:
        return null;
    }
  };

  const allParameters = [...globalParameters, ...currentParameters];

  return (
    <Card>
      <CardHeader>
        <CardDescription hidden={true}></CardDescription>
        <CardTitle>Runtime Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedCommand && tool.commands.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No commands available for this tool.
          </p>
        ) : (
          <div className="space-y-4">
            {allParameters.length > 0 ? (
              allParameters.map(renderParameterInput)
            ) : (
              <p className="text-muted-foreground text-sm">
                No parameters available for this command.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
