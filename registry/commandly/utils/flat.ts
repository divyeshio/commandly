import type { Command, Parameter, Tool } from "@/components/commandly/types/flat";

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
  const findCommandPath = (
    targetKey: string,
    commands: Command[],
    path: string[] = [],
  ): string[] | null => {
    for (const cmd of commands) {
      if (cmd.name === targetKey) {
        return [...path, cmd.name];
      }

      const childCommands = commands.filter((c) => c.parentCommandKey === cmd.key);
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

const SCHEMA_URL = "https://commandly.divyeshio.in/specification/flat.json";

export const sanitizeToolJSON = (tool: Tool) => {
  const parameters = tool.parameters.map(({ metadata: _metadata, ...param }) => param);

  return {
    $schema: SCHEMA_URL,
    ...tool,
    parameters,
  };
};

export const exportToStructuredJSON = (tool: Tool) => {
  return {
    $schema: SCHEMA_URL,
    name: tool.name,
    displayName: tool.displayName,
    info: tool.info,
    commands: tool.commands.map((cmd) => ({ ...cmd })),
    parameters: tool.parameters.map(({ metadata: _metadata, ...param }) => param),
    exclusionGroups: tool.exclusionGroups,
    metadata: tool.metadata,
  };
};

export const createNewParameter = (isGlobal: boolean, commandKey?: string): Parameter => {
  return {
    key: "",
    name: "",
    commandKey: isGlobal ? undefined : commandKey,
    parameterType: "Option",
    dataType: "String",
    ...(isGlobal ? { isGlobal: true } : {}),
    longFlag: "",
  };
};

const isEmpty = (value: object | null | undefined): boolean => {
  if (value == null) return true;
  if (Array.isArray(value)) return value.length === 0;
  return Object.keys(value).length === 0;
};

const cleanParameter = (param: Parameter): Parameter => {
  const cleaned = { ...param };

  if (!cleaned.enum || cleaned.enum.values.length === 0) delete cleaned.enum;
  if (isEmpty(cleaned.validations)) delete cleaned.validations;
  if (isEmpty(cleaned.dependencies)) delete cleaned.dependencies;

  if (cleaned.metadata) {
    const meta = { ...cleaned.metadata };
    if (isEmpty(meta.tags)) delete meta.tags;
    if (isEmpty(meta)) {
      delete cleaned.metadata;
    } else {
      cleaned.metadata = meta;
    }
  }

  return cleaned;
};

export const cleanupTool = (tool: Tool): Tool => {
  const cleaned = { ...tool };

  if (isEmpty(cleaned.exclusionGroups)) delete cleaned.exclusionGroups;
  if (isEmpty(cleaned.metadata)) delete cleaned.metadata;

  cleaned.parameters = cleaned.parameters.map(cleanParameter);

  return cleaned;
};
