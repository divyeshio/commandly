import {
  Tool,
  Command,
  Parameter,
  ExclusionGroup,
  ParameterValue,
  SavedCommand,
} from "@/registry/commandly/lib/types/commandly";
import {
  addSavedCommandToStorage,
  createNewCommand,
  defaultTool,
  getAllSubcommands,
  getSavedCommandsFromStorage,
  removeSavedCommandFromStorage,
  slugify,
} from "@/registry/commandly/lib/utils/commandly";
import { Store } from "@tanstack/react-store";
import { toast } from "sonner";

export interface ToolBuilderState {
  tool: Tool;
  selectedCommand: Command;
  selectedParameter: Parameter | null;
  editingCommand: Command | null;
  parameterValues: Record<string, ParameterValue>;
  dialogs: {
    parameterDetails: boolean;
    editTool: boolean;
    savedCommands: boolean;
    exclusionGroups: boolean;
  };
}

export const toolBuilderStore = new Store<ToolBuilderState>({
  tool: defaultTool(),
  selectedCommand: {} as Command,
  selectedParameter: null,
  editingCommand: null,
  parameterValues: {},
  dialogs: {
    parameterDetails: false,
    editTool: false,
    savedCommands: false,
    exclusionGroups: false,
  },
});

export const toolBuilderSelectors = {
  getParametersForCommand: (state: ToolBuilderState, commandKey: string): Parameter[] => {
    return state.tool.parameters.filter((param: Parameter) => {
      if (param.isGlobal) return false;
      return param.commandKey === commandKey;
    });
  },

  getGlobalParameters: (state: ToolBuilderState): Parameter[] => {
    return state.tool.parameters.filter((param: Parameter) => param.isGlobal);
  },

  getExclusionGroupsForCommand: (state: ToolBuilderState, commandKey: string): ExclusionGroup[] => {
    return (
      state.tool.exclusionGroups?.filter((group: ExclusionGroup) => {
        return group.commandKey === commandKey;
      }) ?? []
    );
  },
};

export const toolBuilderActions = {
  initializeTool(tool: Tool) {
    toolBuilderStore.setState((state) => ({
      ...state,
      tool,
      selectedCommand: tool.commands[0],
    }));
  },

  updateTool(updates: Partial<Tool>) {
    toolBuilderStore.setState((state) => ({
      ...state,
      tool: {
        ...state.tool,
        ...updates,
      },
    }));
  },

  addSubcommand(parentKey?: string) {
    const newCommand = createNewCommand(parentKey);
    toolBuilderStore.setState((state) => ({
      ...state,
      tool: {
        ...state.tool,
        commands: [...state.tool.commands, newCommand],
      },
    }));

    toast("Command Added", {
      description: "New command has been created successfully.",
    });
  },

  deleteCommand(commandKey: string) {
    toolBuilderStore.setState((state) => {
      const subcommands = getAllSubcommands(commandKey, state.tool.commands);
      const commandsToDelete = [commandKey, ...subcommands.map((c) => c.key)];

      const newState = {
        ...state,
        tool: {
          ...state.tool,
          commands: state.tool.commands.filter((cmd) => !commandsToDelete.includes(cmd.key)),
          parameters: state.tool.parameters.filter(
            (param) => !commandsToDelete.includes(param.commandKey || ""),
          ),
          exclusionGroups: state.tool.exclusionGroups?.filter(
            (group) => !commandsToDelete.includes(group.commandKey || ""),
          ),
        },
      };

      if (state.selectedCommand?.key === commandKey) {
        newState.selectedCommand = newState.tool.commands[0];
      }

      return newState;
    });

    toast("Command Deleted", {
      description: "Command and all its subcommands have been deleted.",
    });
  },

  updateCommand(commandKey: string, updates: Partial<Command>) {
    toolBuilderStore.setState((state) => ({
      ...state,
      tool: {
        ...state.tool,
        commands: state.tool.commands.map((cmd) => {
          let updatedCmd: Command;
          if (cmd.key === commandKey) {
            updatedCmd = { ...cmd, ...updates };
          } else {
            if (!updates.isDefault) updatedCmd = cmd;
            else {
              updatedCmd = { ...cmd, isDefault: false };
            }
          }
          return updatedCmd;
        }),
      },
    }));
  },

  removeParameter(parameterKey: string) {
    toolBuilderStore.setState((state) => {
      const newState = {
        ...state,
        tool: {
          ...state.tool,
          parameters: state.tool.parameters.filter((param) => param.key !== parameterKey),
          exclusionGroups: state.tool.exclusionGroups?.map((group) => ({
            ...group,
            parameterKeys: group.parameterKeys.filter((key) => key !== parameterKey),
          })),
        },
      };

      if (state.selectedParameter?.key === parameterKey) {
        newState.selectedParameter = null;
      }

      return newState;
    });

    toast("Parameter Deleted", {
      description: "Parameter has been removed successfully.",
    });
  },
  addSavedCommand(command: string) {
    const toolId = toolBuilderStore.state.tool.name; // Use tool name as id
    const existingCommands = getSavedCommandsFromStorage(toolId);
    if (existingCommands.some((cmd) => cmd.command === command)) {
      toast.error("Command already exists", {
        description: "This command has already been saved.",
      });
      return;
    }
    const newSavedCommand: SavedCommand = {
      key: slugify(command.substring(0, 20)),
      command,
    };

    addSavedCommandToStorage(`saved-${toolId}`, newSavedCommand);

    toast("Command Saved", {
      description: "Command has been saved successfully.",
    });
  },

  removeSavedCommand(commandKey: string) {
    toolBuilderStore.setState((state) => {
      const toolId = state.tool.name;
      removeSavedCommandFromStorage(`saved-${toolId}`, commandKey);
      return { ...state };
    });
  },

  addExclusionGroup(group: Omit<ExclusionGroup, "key">) {
    toolBuilderStore.setState((state) => {
      const newGroup = {
        ...group,
        key: slugify(group.name),
        commandKey: state.selectedCommand?.key,
      };

      return {
        ...state,
        tool: {
          ...state.tool,
          exclusionGroups: [...(state.tool.exclusionGroups ?? []), newGroup],
        },
      };
    });

    toast("Group Added", {
      description: "New exclusion group has been created successfully.",
    });
  },

  updateExclusionGroup(updatedGroup: ExclusionGroup) {
    toolBuilderStore.setState((state) => ({
      ...state,
      tool: {
        ...state.tool,
        exclusionGroups: state.tool.exclusionGroups?.map((group) =>
          group.key === updatedGroup.key ? updatedGroup : group,
        ),
      },
    }));

    toast("Group Updated", {
      description: "Exclusion group has been updated successfully.",
    });
  },

  removeExclusionGroup(groupKey: string) {
    toolBuilderStore.setState((state) => ({
      ...state,
      tool: {
        ...state.tool,
        exclusionGroups: state.tool.exclusionGroups?.filter((group) => group.key !== groupKey),
      },
    }));

    toast("Group Removed", {
      description: "Exclusion group has been removed successfully.",
    });
  },

  setDialogOpen(
    dialog: "editTool" | "savedCommands" | "exclusionGroups" | "parameterDetails",
    open: boolean,
  ) {
    toolBuilderStore.setState((state) => ({
      ...state,
      dialogs: {
        ...state.dialogs,
        [dialog]: open,
      },
    }));
  },

  setSelectedCommand(command: Command) {
    toolBuilderStore.setState((state) => ({
      ...state,
      selectedCommand: command,
    }));
  },

  setSelectedParameter(parameter: Parameter | null) {
    toolBuilderStore.setState((state) => ({
      ...state,
      selectedParameter: parameter,
    }));
  },

  setEditingCommand(command: Command | null) {
    toolBuilderStore.setState((state) => ({
      ...state,
      editingCommand: command,
    }));
  },

  upsertParameter(parameter: Parameter) {
    toolBuilderStore.setState((state) => {
      const exists = state.tool.parameters.some((p) => p.key === parameter.key);
      let newParameters: Parameter[];
      if (exists) {
        newParameters = state.tool.parameters.map((param) => {
          if (param.key === parameter.key) {
            const updatedParam = {
              ...param,
              ...parameter,
              dependencies: parameter.dependencies || [],
              validations: parameter.validations || [],
              enumValues: parameter.enumValues || [],
            };
            if (parameter.isGlobal && parameter.isGlobal !== param.isGlobal) {
              updatedParam.commandKey = undefined;
            }
            if (parameter.isGlobal === false && param.isGlobal) {
              updatedParam.commandKey = state.selectedCommand?.key;
            }
            return updatedParam;
          }
          return param;
        });
        toast("Parameter Updated", {
          description: `Parameter has been updated successfully.`,
        });
      } else {
        newParameters = [...state.tool.parameters, parameter];
        toast("Parameter Added", {
          description: `New ${parameter.isGlobal ? "global " : ""}parameter has been created successfully.`,
        });
      }
      return {
        ...state,
        tool: {
          ...state.tool,
          parameters: newParameters,
        },
      };
    });
  },
};
