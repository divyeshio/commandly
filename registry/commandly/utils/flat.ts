import { SCHEMA_URL } from "@/components/ai-chat/tool-rules";
import type {
  Command,
  ExclusionGroup,
  Parameter,
  ParameterMetadata,
  ParameterValue,
  Tool,
} from "@/components/commandly/types/flat";

export const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
};

export const getCommandPath = (command: Command, tool: Tool): string => {
  const allCommands = tool.commands;
  const findCommandPath = (
    targetKey: string,
    commands: Command[],
    path: string[] = [],
  ): string[] | null => {
    for (const cmd of commands) {
      if (cmd.name === targetKey) {
        return [...path, cmd.name];
      }

      const childCommands = allCommands.filter((c) => c.parentCommandKey === cmd.key);
      if (childCommands.length > 0) {
        const subPath = findCommandPath(targetKey, childCommands, [...path, cmd.name]);
        if (subPath) {
          return subPath;
        }
      }
    }
    return null;
  };

  const rootCommands = tool.commands.filter((c) => !c.parentCommandKey);
  const path = findCommandPath(command.name, rootCommands);

  if (!path) return command.name;

  return path.join(" ");
};

export const getAllSubcommands = (commandKey: string, commands: Command[]): Command[] => {
  const result: Command[] = [];

  const findSubcommands = (parentKey: string) => {
    commands.forEach((cmd) => {
      if (cmd.parentCommandKey === parentKey) {
        result.push(cmd);
        findSubcommands(cmd.key);
      }
    });
  };

  findSubcommands(commandKey);
  return result;
};

export interface GenerateCommandOptions {
  selectedCommand?: Command | null;
  useLongFlag?: boolean;
}

function getPreferredFlag(param: Parameter, useLongFlag: boolean): string | undefined {
  return useLongFlag ? param.longFlag || param.shortFlag : param.shortFlag || param.longFlag;
}

export function generateCommand(
  tool: Tool,
  parameterValues: Record<string, ParameterValue>,
  options: GenerateCommandOptions = {},
): string {
  const hasCommands = tool.commands.length > 0;
  const selectedCommand =
    options.selectedCommand === undefined ? (tool.commands[0] ?? null) : options.selectedCommand;
  const useLongFlag = options.useLongFlag ?? false;

  let command = tool.binaryName;

  if (hasCommands && selectedCommand) {
    const commandPath = getCommandPath(selectedCommand, tool);
    if (tool.binaryName !== commandPath) {
      command = `${tool.binaryName} ${commandPath}`;
    }
  }

  const parametersWithValues: Array<{
    param: Parameter;
    value: ParameterValue;
  }> = [];
  const globalParameters = tool.parameters?.filter((param) => param.isGlobal) ?? [];
  const rootParameters =
    hasCommands && selectedCommand
      ? []
      : (tool.parameters?.filter((param) => !param.commandKey && !param.isGlobal) ?? []);
  const currentParameters = selectedCommand
    ? (tool.parameters?.filter(
        (param) => param.commandKey === selectedCommand.key && !param.isGlobal,
      ) ?? [])
    : [];

  [...globalParameters, ...rootParameters, ...currentParameters].forEach((param) => {
    const value = parameterValues[param.key];
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
        const flag = getPreferredFlag(param, useLongFlag);
        if (flag) command += ` ${flag}`;
      } else if (param.isRepeatable && typeof value === "number" && value > 0) {
        const flag = getPreferredFlag(param, useLongFlag);
        if (flag) command += ` ${flag}`.repeat(value);
      }
      return;
    }

    if (param.parameterType === "Option") {
      const flag = getPreferredFlag(param, useLongFlag);
      if (!flag) return;

      const separator = param.keyValueSeparator ?? " ";
      if (Array.isArray(value)) {
        const entries = value.filter((entry) => entry !== "");
        if (entries.length === 0) return;

        if (param.arraySeparator) {
          command += ` ${flag}${separator}${entries.join(param.arraySeparator)}`;
          return;
        }

        entries.forEach((entry) => {
          command += ` ${flag}${separator}${entry}`;
        });
        return;
      }

      command += ` ${flag}${separator}${value}`;
    }
  });

  positionalParams.forEach(({ value }) => {
    if (!Array.isArray(value)) {
      command += ` ${value}`;
    }
  });

  return command;
}

export const exportToStructuredJSON = (tool: Tool) => {
  return {
    $schema: SCHEMA_URL,
    name: tool.binaryName,
    displayName: tool.displayName,
    info: tool.info,
    commands: tool.commands.map((cmd) => ({ ...cmd })),
    parameters: tool.parameters.map(({ metadata: _metadata, ...param }) => param),
    exclusionGroups: tool.exclusionGroups,
    metadata: tool.metadata,
  };
};

function isEmptyArray(value: unknown): boolean {
  return Array.isArray(value) && value.length === 0;
}

function isEmptyObject(value: unknown): boolean {
  return (
    value != null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).length === 0
  );
}

function cleanParameter(param: Parameter): Parameter {
  const cleaned = { ...param };

  if (cleaned.isRequired === false) delete cleaned.isRequired;
  if (cleaned.isRepeatable === false) delete cleaned.isRepeatable;
  if (cleaned.isGlobal === false) delete cleaned.isGlobal;
  if (cleaned.keyValueSeparator === " ") delete cleaned.keyValueSeparator;
  if (cleaned.arraySeparator === "," && cleaned.isRepeatable !== true)
    delete cleaned.arraySeparator;

  if (!cleaned.enum || isEmptyArray(cleaned.enum.values)) delete cleaned.enum;
  if (isEmptyArray(cleaned.validations)) delete cleaned.validations;
  if (isEmptyArray(cleaned.dependencies)) delete cleaned.dependencies;

  if (cleaned.metadata) {
    const meta = { ...cleaned.metadata } as ParameterMetadata;
    if (isEmptyArray(meta.tags)) delete meta.tags;
    if (isEmptyObject(meta)) {
      delete cleaned.metadata;
    } else {
      cleaned.metadata = meta;
    }
  }

  return cleaned;
}

function cleanCommand(cmd: Command): Command {
  const cleaned = { ...cmd };
  if (cleaned.interactive === false) delete cleaned.interactive;
  return cleaned;
}

function cleanExclusionGroup(group: ExclusionGroup): ExclusionGroup {
  return { ...group };
}

export interface FixToolOptions {
  addSchema?: boolean;
  removeMetadata?: boolean;
}

export function fixTool(tool: Tool, options?: FixToolOptions): Tool {
  const addSchema = options?.addSchema ?? false;
  const removeMetadata = options?.removeMetadata ?? false;

  const cleaned: Record<string, unknown> = { ...tool };

  if (addSchema) {
    cleaned["$schema"] = SCHEMA_URL;
  }

  if (cleaned.interactive === false) delete cleaned.interactive;
  if (isEmptyObject(cleaned.metadata) || removeMetadata) delete cleaned.metadata;
  if (isEmptyArray(cleaned.exclusionGroups)) delete cleaned.exclusionGroups;

  if ("description" in cleaned && cleaned.info == null) {
    cleaned.info = { description: cleaned.description as string };
    delete cleaned.description;
  }

  if ("version" in cleaned && typeof cleaned.version === "string") {
    if (cleaned.info && typeof cleaned.info === "object") {
      (cleaned.info as Record<string, unknown>).version = cleaned.version;
    } else {
      cleaned.info = { version: cleaned.version as string };
    }
    delete cleaned.version;
  }

  if (Array.isArray(cleaned.commands)) {
    cleaned.commands = (cleaned.commands as Command[]).map(cleanCommand);
  }

  if (Array.isArray(cleaned.parameters)) {
    cleaned.parameters = (cleaned.parameters as Parameter[]).map((p) => {
      const fixed = cleanParameter(p);
      if (removeMetadata) delete fixed.metadata;
      return fixed;
    });
  }

  if (
    Array.isArray(cleaned.exclusionGroups) &&
    (cleaned.exclusionGroups as ExclusionGroup[]).length > 0
  ) {
    cleaned.exclusionGroups = (cleaned.exclusionGroups as ExclusionGroup[]).map(
      cleanExclusionGroup,
    );
  }

  return cleaned as unknown as Tool;
}
