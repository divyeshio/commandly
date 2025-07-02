import { Store } from "@tanstack/react-store";
import {
  Tool,
  Command,
  Parameter,
  ExclusionGroup,
  ParameterValue,
  SavedCommand
} from "@/lib/types/tool-editor";
import { toast } from "sonner";
import {
  addSavedCommandToStorage,
  createNewCommand,
  defaultTool,
  getAllSubcommands,
  getSavedCommandsFromStorage,
  removeSavedCommandFromStorage
} from "@/lib/utils/tool-editor";
import { v7 as uuidv7 } from "uuid";

export interface ToolBuilderState {
  tool: Tool;
  selectedCommand: Command | null;
  selectedParameter: Parameter | null;
  editingCommand: Command | null;
  parameterValues: Record<string, ParameterValue>;
  dialogs: {
    editTool: boolean;
    savedCommands: boolean;
    exclusionGroups: boolean;
  };
}

export const toolBuilderStore = new Store<ToolBuilderState>({
  tool: defaultTool(),
  selectedCommand: null,
  selectedParameter: null,
  editingCommand: null,
  parameterValues: {},
  dialogs: {
    editTool: false,
    savedCommands: false,
    exclusionGroups: false
  }
});

export const toolBuilderSelectors = {
  getParametersForCommand: (
    state: ToolBuilderState,
    commandId: string
  ): Parameter[] => {
    return state.tool.parameters.filter((param: Parameter) => {
      if (param.isGlobal) return false;
      return param.commandId === commandId;
    });
  },

  getGlobalParameters: (state: ToolBuilderState): Parameter[] => {
    return state.tool.parameters.filter((param: Parameter) => param.isGlobal);
  },

  getExclusionGroupsForCommand: (
    state: ToolBuilderState,
    commandId: string
  ): ExclusionGroup[] => {
    return state.tool.exclusionGroups.filter((group: ExclusionGroup) => {
      return group.commandId === commandId;
    });
  }
};

export const toolBuilderActions = {
  initializeTool(tool: Tool) {
    toolBuilderStore.setState((state) => ({
      ...state,
      tool,
      selectedCommand: tool.commands[0]
    }));
  },

  updateTool(updates: Partial<Tool>) {
    toolBuilderStore.setState((state) => ({
      ...state,
      tool: {
        ...state.tool,
        ...updates
      }
    }));
  },

  addSubcommand(parentId?: string) {
    const newCommand = createNewCommand(parentId);
    toolBuilderStore.setState((state) => ({
      ...state,
      tool: {
        ...state.tool,
        commands: [...state.tool.commands, newCommand]
      }
    }));

    toast("Command Added", {
      description: "New command has been created successfully."
    });
  },

  deleteCommand(commandId: string) {
    toolBuilderStore.setState((state) => {
      const subcommands = getAllSubcommands(commandId, state.tool.commands);
      const commandsToDelete = [commandId, ...subcommands.map((c) => c.id)];

      const newState = {
        ...state,
        tool: {
          ...state.tool,
          commands: state.tool.commands.filter(
            (cmd) => !commandsToDelete.includes(cmd.id)
          ),
          parameters: state.tool.parameters.filter(
            (param) => !commandsToDelete.includes(param.commandId || "")
          ),
          exclusionGroups: state.tool.exclusionGroups.filter(
            (group) => !commandsToDelete.includes(group.commandId || "")
          )
        }
      };

      if (state.selectedCommand?.id === commandId) {
        newState.selectedCommand = newState.tool.commands[0];
      }

      return newState;
    });

    toast("Command Deleted", {
      description: "Command and all its subcommands have been deleted."
    });
  },

  updateCommand(commandId: string, updates: Partial<Command>) {
    toolBuilderStore.setState((state) => ({
      ...state,
      tool: {
        ...state.tool,
        commands: state.tool.commands.map((cmd) => {
          let updatedCmd: Command;
          if (cmd.id === commandId) {
            updatedCmd = { ...cmd, ...updates };
          } else {
            if (!updates.isDefault) updatedCmd = cmd;
            else {
              updatedCmd = { ...cmd, isDefault: false };
            }
          }
          return updatedCmd;
        })
      }
    }));
  },

  removeParameter(parameterId: string) {
    toolBuilderStore.setState((state) => {
      const newState = {
        ...state,
        tool: {
          ...state.tool,
          parameters: state.tool.parameters.filter(
            (param) => param.id !== parameterId
          ),
          exclusionGroups: state.tool.exclusionGroups.map((group) => ({
            ...group,
            parameterIds: group.parameterIds.filter((id) => id !== parameterId)
          }))
        }
      };

      if (state.selectedParameter?.id === parameterId) {
        newState.selectedParameter = null;
      }

      return newState;
    });

    toast("Parameter Deleted", {
      description: "Parameter has been removed successfully."
    });
  },
  addSavedCommand(command: string) {
    const toolId =
      toolBuilderStore.state.tool.id || toolBuilderStore.state.tool.name;
    const existingCommands = getSavedCommandsFromStorage(toolId);
    if (existingCommands.some((cmd) => cmd.command === command)) {
      toast.error("Command already exists", {
        description: "This command has already been saved."
      });
      return;
    }
    const newSavedCommand: SavedCommand = {
      id: uuidv7(),
      command
    };

    addSavedCommandToStorage(`saved-${toolId}`, newSavedCommand);

    toast("Command Saved", {
      description: "Command has been saved successfully."
    });
  },

  removeSavedCommand(commandId: string) {
    toolBuilderStore.setState((state) => {
      const toolId = state.tool.id || state.tool.name;
      removeSavedCommandFromStorage(`saved-${toolId}`, commandId);
      return { ...state };
    });
  },

  addExclusionGroup(group: Omit<ExclusionGroup, "id">) {
    toolBuilderStore.setState((state) => {
      const newGroup = {
        ...group,
        id: uuidv7(),
        commandId: state.selectedCommand?.id
      };

      return {
        ...state,
        tool: {
          ...state.tool,
          exclusionGroups: [...state.tool.exclusionGroups, newGroup]
        }
      };
    });

    toast("Group Added", {
      description: "New exclusion group has been created successfully."
    });
  },

  updateExclusionGroup(updatedGroup: ExclusionGroup) {
    toolBuilderStore.setState((state) => ({
      ...state,
      tool: {
        ...state.tool,
        exclusionGroups: state.tool.exclusionGroups.map((group) =>
          group.id === updatedGroup.id ? updatedGroup : group
        )
      }
    }));

    toast("Group Updated", {
      description: "Exclusion group has been updated successfully."
    });
  },

  removeExclusionGroup(groupId: string) {
    toolBuilderStore.setState((state) => ({
      ...state,
      tool: {
        ...state.tool,
        exclusionGroups: state.tool.exclusionGroups.filter(
          (group) => group.id !== groupId
        )
      }
    }));

    toast("Group Removed", {
      description: "Exclusion group has been removed successfully."
    });
  },

  setDialogOpen(dialog: "editTool" | "savedCommands" | "exclusionGroups", open: boolean) {
    toolBuilderStore.setState((state) => ({
      ...state,
      dialogs: {
        ...state.dialogs,
        editTool: open
      }
    }));
  },


  setSelectedCommand(command: Command) {
    toolBuilderStore.setState((state) => ({
      ...state,
      selectedCommand: command
    }));
  },

  setSelectedParameter(parameter: Parameter | null) {
    toolBuilderStore.setState((state) => ({
      ...state,
      selectedParameter: parameter
    }));
  },

  setEditingCommand(command: Command | null) {
    toolBuilderStore.setState((state) => ({
      ...state,
      editingCommand: command
    }));
  },

  upsertParameter(parameter: Parameter) {
    toolBuilderStore.setState((state) => {
      const exists = state.tool.parameters.some((p) => p.id === parameter.id);
      let newParameters: Parameter[];
      if (exists) {
        newParameters = state.tool.parameters.map((param) => {
          if (param.id === parameter.id) {
            const updatedParam = {
              ...param,
              ...parameter,
              dependencies: parameter.dependencies || [],
              validations: parameter.validations || [],
              enumValues: parameter.enumValues || []
            };
            if (parameter.isGlobal && parameter.isGlobal !== param.isGlobal) {
              updatedParam.commandId = undefined;
            }
            if (parameter.isGlobal === false && param.isGlobal) {
              updatedParam.commandId = state.selectedCommand?.id;
            }
            return updatedParam;
          }
          return param;
        });
        toast("Parameter Updated", {
          description: `Parameter has been updated successfully.`
        });
      } else {
        newParameters = [...state.tool.parameters, parameter];
        toast("Parameter Added", {
          description: `New ${parameter.isGlobal ? "global " : ""}parameter has been created successfully.`
        });
      }
      return {
        ...state,
        tool: {
          ...state.tool,
          parameters: newParameters
        }
      };
    });
  }
};
