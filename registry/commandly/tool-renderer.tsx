import {
  ParameterRenderContext,
  ParameterRendererEntry,
} from "@/components/commandly/types/renderer";
import { Command, ParameterValue, Tool } from "@/components/commandly/types/tool";
import { getFlagForms } from "@/components/commandly/utils/generate-command";
import {
  excludedParameters,
  getDefaultCommand,
  requiredParameterKeys,
  resolveApplicableParameters,
  resolveExclusionGroups,
} from "@/components/commandly/utils/tool";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command as UICommand,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { CheckIcon, ChevronsUpDownIcon, InfoIcon, PlusIcon, XIcon } from "lucide-react";
import React, { useMemo } from "react";

interface ParameterLabelProps {
  name: string;
  flags?: string[];
  isRequired?: boolean;
  recursive?: boolean;
  excludedBy?: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
}

function ParameterLabel({
  name,
  flags,
  isRequired,
  recursive,
  excludedBy,
  description,
  className,
  children,
}: ParameterLabelProps) {
  return (
    <Label className={className}>
      {name}
      {!!flags?.length && <span className="ml-1 text-muted-foreground">({flags.join(", ")})</span>}
      {isRequired && <span className="ml-1 text-destructive">*</span>}
      {description?.trim() && (
        <Tooltip>
          <TooltipTrigger>
            <InfoIcon className="h-3.5 w-3.5" />
          </TooltipTrigger>
          <TooltipContent>
            <span>{description}</span>
          </TooltipContent>
        </Tooltip>
      )}
      {children}
      {recursive && (
        <Badge
          variant="outline"
          className="ml-2 text-xs"
        >
          recursive
        </Badge>
      )}
      {excludedBy && (
        <Badge
          variant="outline"
          className="ml-2 text-xs"
        >
          excluded by {excludedBy}
        </Badge>
      )}
    </Label>
  );
}

function FlagInput({
  parameter,
  flags,
  value,
  onUpdate,
  isRequired,
  excludedBy,
}: ParameterRenderContext) {
  return (
    <div className="flex items-center space-x-2">
      <Switch
        checked={value === "true" || value === true}
        onCheckedChange={onUpdate}
        disabled={!!excludedBy}
      />
      <ParameterLabel
        className="flex-1 select-auto"
        name={parameter.displayName}
        flags={flags}
        isRequired={isRequired}
        recursive={parameter.recursive}
        excludedBy={excludedBy}
        description={parameter.description}
      />
    </div>
  );
}

function OptionEnumInput({
  parameter,
  flags,
  value,
  onUpdate,
  isRequired,
  excludedBy,
}: ParameterRenderContext) {
  const [open, setOpen] = React.useState(false);
  const separator = parameter.enum?.separator || ",";
  const options =
    parameter.enum?.values?.map((e) => ({
      value: e.value,
      label: e.displayName || e.value,
    })) ?? [];

  const label = (
    <ParameterLabel
      className="select-auto"
      name={parameter.displayName}
      flags={flags}
      isRequired={isRequired}
      recursive={parameter.recursive}
      excludedBy={excludedBy}
      description={parameter.description}
    />
  );

  if (parameter.enum?.allowMultiple) {
    const selected = Array.isArray(value)
      ? (value as string[]).filter(Boolean)
      : value
        ? (value as string).split(separator).filter(Boolean)
        : [];
    return (
      <div className="space-y-2">
        {label}
        <MultiSelect
          options={options}
          defaultValue={selected}
          onValueChange={(vals) => onUpdate(vals.join(separator))}
          placeholder="Select options"
          disabled={!!excludedBy}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label}
      <Popover
        open={open}
        onOpenChange={setOpen}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
            disabled={!!excludedBy}
          >
            {options.find((o) => o.value === value)?.label ?? "Select an option"}
            <ChevronsUpDownIcon className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0"
          align="start"
        >
          <UICommand>
            <CommandInput placeholder="Search..." />
            <CommandList>
              <CommandEmpty>No option found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={(currentValue) => {
                      onUpdate(currentValue === value ? "" : currentValue);
                      setOpen(false);
                    }}
                  >
                    {option.label}
                    <CheckIcon
                      className={cn(
                        "ml-auto",
                        value === option.value ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </UICommand>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function OptionBooleanInput({
  parameter,
  flags,
  value,
  onUpdate,
  isRequired,
  excludedBy,
}: ParameterRenderContext) {
  return (
    <div className="flex items-center space-x-2">
      <Switch
        checked={value === "true" || value === true}
        onCheckedChange={(checked) => onUpdate(checked.toString())}
        disabled={!!excludedBy}
      />
      <ParameterLabel
        className="flex-1 select-auto"
        name={parameter.displayName}
        flags={flags}
        isRequired={isRequired}
        recursive={parameter.recursive}
        excludedBy={excludedBy}
        description={parameter.description}
      />
    </div>
  );
}

function OptionTextInput({
  parameter,
  flags,
  value,
  onUpdate,
  isRequired,
  excludedBy,
}: ParameterRenderContext) {
  return (
    <div className="space-y-2">
      <ParameterLabel
        className="flex-1 select-auto"
        name={parameter.displayName}
        flags={flags}
        isRequired={isRequired}
        recursive={parameter.recursive}
        excludedBy={excludedBy}
        description={parameter.description}
      />
      <Input
        type={parameter.dataType === "Number" ? "number" : "text"}
        value={parameter.dataType === "Number" ? (value as number) : (value as string)}
        onChange={(e) => onUpdate(e.target.value)}
        placeholder="Enter value"
        disabled={!!excludedBy}
      />
    </div>
  );
}

function ArgumentInput({
  parameter,
  value,
  onUpdate,
  isRequired,
  excludedBy,
}: ParameterRenderContext) {
  return (
    <div className="space-y-2">
      <ParameterLabel
        name={parameter.displayName}
        isRequired={isRequired}
        excludedBy={excludedBy}
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
        disabled={!!excludedBy}
      />
    </div>
  );
}

interface RepeatableWrapperProps {
  context: ParameterRenderContext;
  renderEntry: ParameterRendererEntry["component"];
}

function RepeatableWrapper({ context, renderEntry }: RepeatableWrapperProps) {
  const toArray = (value: ParameterValue): string[] => {
    if (Array.isArray(value)) return value;
    if (value !== undefined && value !== "" && value !== false) return [String(value)];
    return [""];
  };

  const values = toArray(context.value);

  const updateAt = (index: number, value: ParameterValue) => {
    const next = [...values];
    next[index] = String(value);
    context.onUpdate(next);
  };

  const addRow = () => context.onUpdate([...values, ""]);

  const removeAt = (index: number) => context.onUpdate(values.filter((_, i) => i !== index));

  return (
    <div className="space-y-2">
      {values.map((value, index) => (
        <div
          key={index}
          className="flex items-start gap-2"
        >
          <div className="flex-1">
            {renderEntry({ ...context, value, onUpdate: (v) => updateAt(index, v) })}
          </div>
          {index > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mt-6 shrink-0"
              onClick={() => removeAt(index)}
            >
              <XIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-muted-foreground"
        onClick={addRow}
        disabled={!!context.excludedBy}
      >
        <PlusIcon className="mr-1 h-3.5 w-3.5" />
        Add another
      </Button>
    </div>
  );
}

export function defaultComponents(): ParameterRendererEntry[] {
  return [
    { condition: (p) => p.parameterType === "Flag", component: (ctx) => <FlagInput {...ctx} /> },
    {
      condition: (p) => p.parameterType === "Argument",
      component: (ctx) => <ArgumentInput {...ctx} />,
    },
    {
      condition: (p) => p.parameterType === "Option" && p.dataType === "Enum",
      component: (ctx) => <OptionEnumInput {...ctx} />,
    },
    {
      condition: (p) => p.parameterType === "Option" && p.dataType === "Boolean",
      component: (ctx) => <OptionBooleanInput {...ctx} />,
    },
    {
      condition: (p) => p.parameterType === "Option",
      component: (ctx) => <OptionTextInput {...ctx} />,
    },
  ];
}

interface ToolRendererProps {
  selectedCommand?: Command | null;
  tool: Tool;
  catalog?: ParameterRendererEntry[];
  parameterValues: Record<string, ParameterValue>;
  updateParameterValue: (parameterKey: string, value: ParameterValue) => void;
}

export function ToolRenderer({
  selectedCommand: providedCommand,
  tool,
  catalog = defaultComponents(),
  parameterValues,
  updateParameterValue,
}: ToolRendererProps) {
  const selectedCommand = providedCommand === undefined ? getDefaultCommand(tool) : providedCommand;

  const visibleParameters = useMemo(
    () => resolveApplicableParameters(tool, selectedCommand),
    [tool, selectedCommand],
  );

  const exclusionGroups = useMemo(
    () => resolveExclusionGroups(tool, selectedCommand),
    [tool, selectedCommand],
  );
  const excluded = useMemo(
    () => excludedParameters(exclusionGroups, parameterValues),
    [exclusionGroups, parameterValues],
  );
  const required = useMemo(
    () => requiredParameterKeys(exclusionGroups, parameterValues),
    [exclusionGroups, parameterValues],
  );

  return (
    <div className="space-y-4">
      {visibleParameters.length > 0 ? (
        visibleParameters.map((parameter) => {
          const entry = catalog.find((e) => e.condition(parameter));
          if (!entry) return null;

          const context: ParameterRenderContext = {
            parameter,
            flags: getFlagForms(parameter),
            value: parameterValues[parameter.key] ?? "",
            onUpdate: (value) => updateParameterValue(parameter.key, value),
            isRequired: parameter.isRequired || required.has(parameter.key),
            excludedBy: excluded.get(parameter.key)?.displayName,
          };

          return (
            <React.Fragment key={parameter.key}>
              {parameter.isRepeatable ? (
                <RepeatableWrapper
                  context={context}
                  renderEntry={entry.component}
                />
              ) : (
                entry.component(context)
              )}
            </React.Fragment>
          );
        })
      ) : (
        <p className="text-sm text-muted-foreground">No parameters available for this command.</p>
      )}
    </div>
  );
}
