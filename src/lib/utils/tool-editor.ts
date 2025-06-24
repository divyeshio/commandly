import type {
  Command,
  Parameter,
  SavedCommand,
  Tool,
} from "@/lib/types/tool-editor";
import { v7 as uuidv7 } from "uuid";

export const buildCommandHierarchy = (commands: Command[]): Command[] => {
  const commandMap = new Map<string, Command>();
  const rootCommands: Command[] = [];

  commands.forEach((cmd) => {
    commandMap.set(cmd.id, { ...cmd, subcommands: [] });
  });

  commands.forEach((cmd) => {
    const command = commandMap.get(cmd.id)!;

    if (!cmd.parentCommandId) {
      rootCommands.push(command);
    } else {
      const parent = commandMap.get(cmd.parentCommandId);
      if (parent) {
        parent.subcommands.push(command);
      }
    }
  });

  const sortCommands = (commands: Command[]): Command[] => {
    return commands
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((cmd) => ({
        ...cmd,
        subcommands: sortCommands(cmd.subcommands),
      }));
  };

  return sortCommands(rootCommands);
};

export const getCommandPath = (command: Command, tool: Tool): string => {
  const findCommandPath = (
    targetId: string,
    commands: Command[],
    path: string[] = []
  ): string[] | null => {
    for (const cmd of commands) {
      const currentPath = [...path, cmd.name];

      if (cmd.name === targetId) {
        return currentPath;
      }

      const subPath = findCommandPath(targetId, cmd.subcommands, currentPath);
      if (subPath) {
        return subPath;
      }
    }
    return null;
  };

  const hierarchy = buildCommandHierarchy(tool.commands);
  const path = findCommandPath(command.name, hierarchy);

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

export const getAllSubcommands = (
  commandId: string,
  commands: Command[]
): Command[] => {
  const result: Command[] = [];

  const findSubcommands = (parentId: string) => {
    commands.forEach((cmd) => {
      if (cmd.parentCommandId === parentId) {
        result.push(cmd);
        findSubcommands(cmd.id);
      }
    });
  };

  findSubcommands(commandId);
  return result;
};

export const exportToStructuredJSON = (tool: Tool) => {
  const flattenCommand = (cmd: Command) => {
    const flatCmd = { ...cmd };
    delete (flatCmd as { subcommands?: Command[] }).subcommands;
    return flatCmd;
  };

  return {
    name: tool.name,
    displayName: tool.displayName,
    description: tool.description,
    version: tool.version,
    commands: tool.commands.map(flattenCommand),
    parameters: tool.parameters,
    exclusionGroups: tool.exclusionGroups,
    supportedInput: tool.supportedInput,
    supportedOutput: tool.supportedOutput,
  };
};

export const flattenImportedData = (importedData: any): Tool => {
  const {
    name,
    displayName,
    parameters = [],
    commands = [],
    exclusionGroups = [],
    supportedInput = [],
    supportedOutput = [],
  } = importedData;

  // Flatten parameters from commands
  const allParameters: Parameter[] = [...parameters];

  const flattenCommandParameters = (
    command: any,
    parentId?: string
  ): Command[] => {
    const { parameters = [], subcommands = [], ...commandData } = command;

    // Add command parameters to the global parameters list
    parameters.forEach((param: any) => {
      allParameters.push({
        ...param,
        commandId: command.id,
        isGlobal: !command.name,
      });
    });

    const flatCommand: Command = {
      ...commandData,
      parentCommandId: parentId,
    };

    const flatCommands = [flatCommand];

    // Recursively flatten subcommands
    subcommands.forEach((subcmd: any) => {
      flatCommands.push(...flattenCommandParameters(subcmd, command.name));
    });

    return flatCommands;
  };

  const flatCommands: Command[] = [];
  commands.forEach((cmd: any) => {
    flatCommands.push(...flattenCommandParameters(cmd));
  });

  return {
    name: name,
    displayName: displayName || name,
    commands: flatCommands,
    parameters: allParameters,
    exclusionGroups,
    supportedInput: supportedInput,
    supportedOutput: supportedOutput,
  };
};

export const defaultTool = (toolName?: string, displayName?: string): Tool => {
  return {
    name: toolName || "my-tool",
    displayName: displayName || "My Tool",
    description: "",
    version: "",
    commands: [
      {
        id: uuidv7(),
        name: toolName || "my-tool",
        description: "Main command",
        isDefault: true,
        sortOrder: 0,
        subcommands: [],
      },
    ],
    parameters: [
      {
        id: "--help",
        name: "Help",
        description: "Displays help menu of tool",
        parameterType: "Flag",
        dataType: "String",
        isRequired: false,
        isGlobal: true,
        shortFlag: "-h",
        longFlag: "--help",
        isRepeatable: false,
        enumValues: [],
        validations: [],
        dependencies: [],
      },
    ],
    exclusionGroups: [],
    supportedInput: ["StandardInput"],
    supportedOutput: ["StandardOutput"],
  };
};

export const validateDefaultValue = (
  parameter: Parameter
): { isValid: boolean; error?: string } => {
  const { defaultValue, validations, dataType } = parameter;

  if (!defaultValue || !validations) return { isValid: true };

  // Data type validation
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

  // Custom validations
  for (const validation of validations) {
    const value = dataType === "Number" ? Number(defaultValue) : defaultValue;

    switch (validation.validationType) {
      case "min_length":
        if (
          typeof value === "string" &&
          value.length < Number(validation.validationValue)
        ) {
          return {
            isValid: false,
            error: validation.errorMessage || "Value too short",
          };
        }
        break;
      case "max_length":
        if (
          typeof value === "string" &&
          value.length > Number(validation.validationValue)
        ) {
          return {
            isValid: false,
            error: validation.errorMessage || "Value too long",
          };
        }
        break;
      case "min_value":
        if (
          typeof value === "number" &&
          value < Number(validation.validationValue)
        ) {
          return {
            isValid: false,
            error: validation.errorMessage || "Value too small",
          };
        }
        break;
      case "max_value":
        if (
          typeof value === "number" &&
          value > Number(validation.validationValue)
        ) {
          return {
            isValid: false,
            error: validation.errorMessage || "Value too large",
          };
        }
        break;
      case "regex":
        if (
          typeof value === "string" &&
          !new RegExp(validation.validationValue).test(value)
        ) {
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

export const createNewCommand = (parentId?: string): Command => {
  return {
    id: uuidv7(),
    parentCommandId: parentId,
    name: randomCommandName(),
    description: "",
    isDefault: false,
    sortOrder: 1,
    subcommands: [],
  };
};

export const createNewParameter = (
  isGlobal: boolean,
  commandId?: string
): Parameter => {
  return {
    id: uuidv7(),
    name: "new-parameter",
    commandId: isGlobal ? undefined : commandId,
    description: "",
    parameterType: "Option",
    dataType: "String",
    isRequired: false,
    isRepeatable: false,
    isGlobal,
    defaultValue: "",
    shortFlag: "",
    longFlag: "",
    sortOrder: 0,
    arraySeparator: ",",
    keyValueSeparator: " ",
    enumValues: [],
    validations: [],
    dependencies: [],
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

export const saveSavedCommandsToStorage = (
  toolId: string,
  commands: SavedCommand[]
): void => {
  try {
    localStorage.setItem(toolId, JSON.stringify(commands));
  } catch (error) {
    console.error("Failed to save commands to localStorage:", error);
  }
};

export const addSavedCommandToStorage = (
  toolId: string,
  command: SavedCommand
): void => {
  const existingCommands = getSavedCommandsFromStorage(toolId);
  const updatedCommands = [...existingCommands, command];
  saveSavedCommandsToStorage(toolId, updatedCommands);
};

export const removeSavedCommandFromStorage = (
  toolId: string,
  commandId: string
): void => {
  const existingCommands = getSavedCommandsFromStorage(toolId);
  const updatedCommands = existingCommands.filter(
    (cmd) => cmd.id !== commandId
  );
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
  for (let i = 0; i < s.length; i++)
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;

  return h.toString();
}
