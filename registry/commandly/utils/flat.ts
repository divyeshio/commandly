import type { Command, ExclusionGroup, Parameter, Tool } from "@/components/commandly/types/flat";

export const buildCommandHierarchy = (commands: Command[]): Command[] => {
  return commands.sort(
    (a, b) => (a.sortOrder ?? commands.indexOf(a)) - (b.sortOrder ?? commands.indexOf(b)),
  );
};

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

  if (command.name === tool.name && command.isDefault) {
    return tool.name;
  }

  const rootCommand = tool.commands.find((c) => c.name === tool.name);
  if (rootCommand?.isDefault && path[0] === tool.name) {
    path[0] = tool.name;
  }

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

export const sanitizeToolJSON = (tool: Record<string, unknown>): Record<string, unknown> => {
  const parameters = Array.isArray(tool.parameters)
    ? (tool.parameters as Record<string, unknown>[]).map(
        ({ metadata: _metadata, ...param }) => param,
      )
    : tool.parameters;

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
    url: tool.info?.url,
    commands: tool.commands.map((cmd) => ({ ...cmd })),
    parameters: tool.parameters.map(({ metadata: _metadata, ...param }) => param),
    exclusionGroups: tool.exclusionGroups,
    metadata: tool.metadata,
  };
};

export const flattenImportedData = (importedData: Record<string, unknown>): Tool => {
  const {
    name,
    displayName,
    commands = [],
    exclusionGroups = [],
    metadata = {
      supportedInput: [],
      supportedOutput: [],
    },
  } = importedData as {
    name: string;
    displayName?: string;
    parameters?: Parameter[];
    commands?: Record<string, unknown>[];
    exclusionGroups?: ExclusionGroup[];
    metadata?: Tool["metadata"];
  };

  const allParameters: Parameter[] = [];

  const flattenCommandParameters = (
    command: Record<string, unknown>,
    parentKey?: string,
  ): Command[] => {
    const {
      parameters = [],
      subcommands = [],
      ...commandData
    } = command as {
      parameters?: Parameter[];
      subcommands?: Record<string, unknown>[];
      [key: string]: unknown;
    };

    (parameters as Parameter[]).forEach((param: Parameter) => {
      allParameters.push({
        ...param,
        commandKey: command.key as string,
        ...(!command.name ? { isGlobal: true } : {}),
      });
    });

    const flatCommand: Command = {
      ...commandData,
      parentCommandKey: parentKey,
    } as Command;

    const flatCommands = [flatCommand];

    (subcommands as Record<string, unknown>[]).forEach((subcmd) => {
      flatCommands.push(...flattenCommandParameters(subcmd, command.key as string));
    });

    return flatCommands;
  };

  const flatCommands: Command[] = [];
  (commands as Record<string, unknown>[]).forEach((cmd) => {
    flatCommands.push(...flattenCommandParameters(cmd));
  });

  return {
    name: name,
    displayName: displayName || name,
    info: importedData.info as Tool["info"] | undefined,
    commands: flatCommands,
    parameters: allParameters,
    exclusionGroups,
    metadata,
  };
};

export const validateDefaultValue = (
  parameter: Parameter,
): { isValid: boolean; error?: string } => {
  void parameter;
  return { isValid: true };
};

export const createNewCommand = (parentKey?: string): Command => {
  const name = randomCommandName();
  return {
    key: slugify(name),
    parentCommandKey: parentKey,
    name,
    isDefault: false,
    sortOrder: 1,
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

export const randomCommandName = () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let result = "";
  const charactersLength = characters.length;
  for (let i = 0; i < 7; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

export function generateHashCode(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;

  return h.toString();
}

const isEmpty = (value: unknown[] | Record<string, unknown> | null | undefined): boolean => {
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
    if (isEmpty(meta as Record<string, unknown>)) {
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
  if (isEmpty(cleaned.metadata as Record<string, unknown> | null | undefined))
    delete cleaned.metadata;

  cleaned.parameters = cleaned.parameters.map(cleanParameter);

  return cleaned;
};
