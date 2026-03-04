import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Parameter, ParameterValue } from "@/registry/commandly/lib/types/commandly";
import { Command, Tool } from "@/registry/commandly/lib/types/commandly";
import { InfoIcon } from "lucide-react";
import React from "react";

const findDefaultCommand = (tool: Tool): Command | null => {
  const defaultCommand = tool.commands.find((command) => command.isDefault);
  if (defaultCommand) return defaultCommand;

  const nameMatchCommand = tool.commands.find(
    (command) => command.name.toLowerCase() === tool.name.toLowerCase(),
  );
  if (nameMatchCommand) return nameMatchCommand;

  return tool.commands.length > 0 ? tool.commands[0] : null;
};

interface ParameterLabelProps {
  name: string;
  longFlag?: string;
  shortFlag?: string;
  isRequired?: boolean;
  isGlobal?: boolean;
  description: string;
  className?: string;
  children?: React.ReactNode;
}

function ParameterLabel({
  name,
  longFlag,
  shortFlag,
  isRequired,
  isGlobal,
  description,
  className,
  children,
}: ParameterLabelProps) {
  return (
    <Label className={className}>
      {name}
      {(longFlag || shortFlag) && (
        <span className="ml-1 text-muted-foreground">
          ({[longFlag, shortFlag].filter(Boolean).join(", ")})
        </span>
      )}
      {isRequired && <span className="ml-1 text-destructive">*</span>}
      <Tooltip>
        <TooltipTrigger>
          <InfoIcon className="h-3.5 w-3.5" />
        </TooltipTrigger>
        <TooltipContent>
          <span>{description}</span>
        </TooltipContent>
      </Tooltip>
      {children}
      {isGlobal && (
        <Badge
          variant="outline"
          className="ml-2 text-xs"
        >
          global
        </Badge>
      )}
    </Label>
  );
}

type ParameterInputProps = {
  parameter: Parameter;
  value: ParameterValue;
  onUpdate: (value: ParameterValue) => void;
};

function FlagInput({ parameter, value, onUpdate }: ParameterInputProps) {
  return (
    <div className="flex items-center space-x-2">
      <Switch
        checked={value === "true" || value === true}
        onCheckedChange={onUpdate}
      />
      <ParameterLabel
        className="flex-1 select-auto"
        name={parameter.name}
        longFlag={parameter.longFlag}
        shortFlag={parameter.shortFlag}
        isRequired={parameter.isRequired}
        isGlobal={parameter.isGlobal}
        description={parameter.description}
      />
    </div>
  );
}

function OptionEnumInput({ parameter, value, onUpdate }: ParameterInputProps) {
  return (
    <div className="space-y-2">
      <ParameterLabel
        className="select-auto"
        name={parameter.name}
        longFlag={parameter.longFlag}
        shortFlag={parameter.shortFlag}
        isRequired={parameter.isRequired}
        isGlobal={parameter.isGlobal}
        description={parameter.description}
      />
      <Select
        value={value as string}
        onValueChange={onUpdate}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          {parameter.enumValues.map((enumValue) => (
            <SelectItem
              key={enumValue.key}
              value={enumValue.value}
            >
              {enumValue.displayName || enumValue.value}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function OptionBooleanInput({ parameter, value, onUpdate }: ParameterInputProps) {
  return (
    <div className="flex items-center space-x-2">
      <Switch
        checked={value === "true" || value === true}
        onCheckedChange={(checked) => onUpdate(checked.toString())}
      />
      <ParameterLabel
        className="flex-1 select-auto"
        name={parameter.name}
        longFlag={parameter.longFlag}
        shortFlag={parameter.shortFlag}
        isRequired={parameter.isRequired}
        isGlobal={parameter.isGlobal}
        description={parameter.description}
      />
    </div>
  );
}

function OptionTextInput({ parameter, value, onUpdate }: ParameterInputProps) {
  return (
    <div className="space-y-2">
      <ParameterLabel
        className="flex-1 select-auto"
        name={parameter.name}
        longFlag={parameter.longFlag}
        shortFlag={parameter.shortFlag}
        isRequired={parameter.isRequired}
        isGlobal={parameter.isGlobal}
        description={parameter.description}
      />
      <Input
        type={parameter.dataType === "Number" ? "number" : "text"}
        value={parameter.dataType === "Number" ? (value as number) : (value as string)}
        onChange={(e) => onUpdate(e.target.value)}
        placeholder="Enter value"
      />
    </div>
  );
}

function ArgumentInput({ parameter, value, onUpdate }: ParameterInputProps) {
  return (
    <div className="space-y-2">
      <ParameterLabel
        name={parameter.name}
        isRequired={parameter.isRequired}
        description={parameter.description}
      >
        <Badge
          variant="secondary"
          className="ml-2 text-xs"
        >
          {parameter.parameterType}
          {parameter.position !== undefined && ` (${parameter.position})`}
        </Badge>
      </ParameterLabel>
      <Input
        type={parameter.dataType === "Number" ? "number" : "text"}
        value={parameter.dataType === "Number" ? (value as number) : (value as string)}
        onChange={(e) => onUpdate(e.target.value)}
        placeholder="Enter value"
      />
    </div>
  );
}

interface RuntimePreviewProps {
  selectedCommand?: Command | null;
  tool: Tool;
  parameterValues: Record<string, ParameterValue>;
  updateParameterValue: (parameterKey: string, value: ParameterValue) => void;
}

export function RuntimePreview({
  selectedCommand: providedCommand,
  tool,
  parameterValues,
  updateParameterValue,
}: RuntimePreviewProps) {
  const selectedCommand = providedCommand ?? findDefaultCommand(tool);

  return (
    <React.Fragment>
      {selectedCommand && tool.commands.length === 0 ? (
        <p className="text-sm text-muted-foreground">No commands available for this tool.</p>
      ) : (
        <div className="space-y-4">
          {tool.parameters.length > 0 ? (
            tool.parameters
              .filter((param) => param.commandKey === selectedCommand?.key || param.isGlobal)
              .map((parameter) => {
                const value = parameterValues[parameter.key] || parameter.defaultValue || "";
                const onUpdate = (val: ParameterValue) => updateParameterValue(parameter.key, val);

                if (parameter.parameterType === "Flag") {
                  return (
                    <FlagInput
                      key={parameter.key}
                      parameter={parameter}
                      value={value}
                      onUpdate={onUpdate}
                    />
                  );
                }
                if (parameter.parameterType === "Argument") {
                  return (
                    <ArgumentInput
                      key={parameter.key}
                      parameter={parameter}
                      value={value}
                      onUpdate={onUpdate}
                    />
                  );
                }
                if (parameter.parameterType === "Option") {
                  if (parameter.dataType === "Enum") {
                    return (
                      <OptionEnumInput
                        key={parameter.key}
                        parameter={parameter}
                        value={value}
                        onUpdate={onUpdate}
                      />
                    );
                  }
                  if (parameter.dataType === "Boolean") {
                    return (
                      <OptionBooleanInput
                        key={parameter.key}
                        parameter={parameter}
                        value={value}
                        onUpdate={onUpdate}
                      />
                    );
                  }
                  return (
                    <OptionTextInput
                      key={parameter.key}
                      parameter={parameter}
                      value={value}
                      onUpdate={onUpdate}
                    />
                  );
                }
                return null;
              })
          ) : (
            <p className="text-sm text-muted-foreground">
              No parameters available for this command.
            </p>
          )}
        </div>
      )}
    </React.Fragment>
  );
}
