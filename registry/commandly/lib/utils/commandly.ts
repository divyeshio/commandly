import type {
  Command,
  ExclusionGroup,
  Parameter,
  SavedCommand,
  Tool,
} from "@/registry/commandly/lib/types/commandly";

export const buildCommandHierarchy = (commands: Command[]): Command[] => {
  return commands.sort((a, b) => (a.sortOrder ?? commands.indexOf(a)) - (b.sortOrder ?? commands.indexOf(b)));
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

export const exportToStructuredJSON = (tool: Tool) => {
  const flattenCommand = (cmd: Command) => {
    return { ...cmd };
  };

  return {
    name: tool.name,
    displayName: tool.displayName,
    description: tool.description,
    version: tool.version,
    commands: tool.commands.map(flattenCommand),
    parameters: tool.parameters,
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
        isGlobal: !command.name,
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
    commands: flatCommands,
    parameters: allParameters,
    exclusionGroups,
    metadata,
  };
};

export const defaultTool = (toolName?: string, displayName?: string): Tool => {
  const finalToolName = toolName || "my-tool";
  return {
    name: finalToolName,
    displayName: displayName || "My Tool",
    commands: [
      {
        key: slugify(finalToolName),
        name: finalToolName,
        description: "Main command",
        isDefault: true,
        sortOrder: 0,
      },
    ],
    parameters: [
      {
        key: "--help",
        name: "Help",
        description: "Displays help menu of tool",
        parameterType: "Flag",
        dataType: "String",
        isRequired: false,
        isGlobal: true,
        shortFlag: "-h",
        longFlag: "--help",
        isRepeatable: false,
      },
    ],
  };
};

export const validateDefaultValue = (
  parameter: Parameter,
): { isValid: boolean; error?: string } => {
  const { defaultValue, validations, dataType } = parameter;

  if (!defaultValue || !validations) return { isValid: true };

  switch (dataType) {
    case "Number":
      if (!/^-?\d+$/.test(defaultValue)) {
        return { isValid: false, error: "Default value must be an integer" };
      }
      break;
    case "Boolean":
      if (!["true", "false", "1", "0"].includes(defaultValue.toLowerCase())) {
        return {
          isValid: false,
          error: "Default value must be true/false or 1/0",
        };
      }
      break;
  }

  for (const validation of validations) {
    const value = dataType === "Number" ? Number(defaultValue) : defaultValue;

    switch (validation.validationType) {
      case "min_length":
        if (typeof value === "string" && value.length < Number(validation.validationValue)) {
          return {
            isValid: false,
            error: validation.errorMessage || "Value too short",
          };
        }
        break;
      case "max_length":
        if (typeof value === "string" && value.length > Number(validation.validationValue)) {
          return {
            isValid: false,
            error: validation.errorMessage || "Value too long",
          };
        }
        break;
      case "min_value":
        if (typeof value === "number" && value < Number(validation.validationValue)) {
          return {
            isValid: false,
            error: validation.errorMessage || "Value too small",
          };
        }
        break;
      case "max_value":
        if (typeof value === "number" && value > Number(validation.validationValue)) {
          return {
            isValid: false,
            error: validation.errorMessage || "Value too large",
          };
        }
        break;
      case "regex":
        if (typeof value === "string" && !new RegExp(validation.validationValue).test(value)) {
          return {
            isValid: false,
            error: validation.errorMessage || "Value doesn't match pattern",
          };
        }
        break;
    }
  }

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
    isRequired: false,
    isRepeatable: false,
    isGlobal,
    longFlag: "",
  };
};

export const getSavedCommandsFromStorage = (toolId: string): SavedCommand[] => {
  try {
    const saved = localStorage.getItem(`saved-${toolId}`);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export const saveSavedCommandsToStorage = (toolId: string, commands: SavedCommand[]): void => {
  try {
    localStorage.setItem(toolId, JSON.stringify(commands));
  } catch (error) {
    console.error("Failed to save commands to localStorage:", error);
  }
};

export const addSavedCommandToStorage = (toolId: string, command: SavedCommand): void => {
  const existingCommands = getSavedCommandsFromStorage(toolId);
  const updatedCommands = [...existingCommands, command];
  saveSavedCommandsToStorage(toolId, updatedCommands);
};

export const removeSavedCommandFromStorage = (toolId: string, commandKey: string): void => {
  const existingCommands = getSavedCommandsFromStorage(toolId);
  const updatedCommands = existingCommands.filter((cmd) => cmd.key !== commandKey);
  saveSavedCommandsToStorage(toolId, updatedCommands);
};

export const clearSavedCommandsFromStorage = (toolId: string): void => {
  localStorage.removeItem(toolId);
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
