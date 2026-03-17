import {
  Tool,
  Command,
  Parameter,
  ExclusionGroup,
  ParameterValue,
} from "@/registry/commandly/lib/types/commandly";
import {
  cleanupTool,
  createNewCommand,
  defaultTool,
  getAllSubcommands,
  slugify,
} from "@/registry/commandly/lib/utils/commandly";
import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useMemo,
  useRef,
  ReactNode,
} from "react";
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

type DialogKey = "parameterDetails" | "editTool" | "savedCommands" | "exclusionGroups";

type Action =
  | { type: "INITIALIZE_TOOL"; payload: Tool }
  | { type: "UPDATE_TOOL"; payload: Partial<Tool> }
  | { type: "ADD_SUBCOMMAND"; payload: Command }
  | { type: "DELETE_COMMAND"; payload: string }
  | { type: "UPDATE_COMMAND"; payload: { commandKey: string; updates: Partial<Command> } }
  | { type: "REMOVE_PARAMETER"; payload: string }
  | { type: "SET_DIALOG_OPEN"; payload: { dialog: DialogKey; open: boolean } }
  | { type: "SET_SELECTED_COMMAND"; payload: Command }
  | { type: "SET_SELECTED_PARAMETER"; payload: Parameter | null }
  | { type: "SET_EDITING_COMMAND"; payload: Command | null }
  | { type: "UPSERT_PARAMETER"; payload: Parameter }
  | { type: "ADD_EXCLUSION_GROUP"; payload: ExclusionGroup }
  | { type: "UPDATE_EXCLUSION_GROUP"; payload: ExclusionGroup }
  | { type: "REMOVE_EXCLUSION_GROUP"; payload: string }
  | { type: "SET_PARAMETER_VALUE"; payload: { key: string; value: ParameterValue } };

function getDefaultState(tool: Tool): ToolBuilderState {
  return {
    tool,
    selectedCommand: tool.commands[0] ?? ({} as Command),
    selectedParameter: null,
    editingCommand: null,
    parameterValues: {},
    dialogs: {
      parameterDetails: false,
      editTool: false,
      savedCommands: false,
      exclusionGroups: false,
    },
  };
}

function toolBuilderReducer(state: ToolBuilderState, action: Action): ToolBuilderState {
  switch (action.type) {
    case "INITIALIZE_TOOL":
      return getDefaultState(cleanupTool(action.payload));

    case "UPDATE_TOOL":
      return { ...state, tool: cleanupTool({ ...state.tool, ...action.payload }) };

    case "ADD_SUBCOMMAND":
      return {
        ...state,
        tool: { ...state.tool, commands: [...state.tool.commands, action.payload] },
      };

    case "DELETE_COMMAND": {
      const subcommands = getAllSubcommands(action.payload, state.tool.commands);
      const commandsToDelete = [action.payload, ...subcommands.map((c) => c.key)];
      const newCommands = state.tool.commands.filter((cmd) => !commandsToDelete.includes(cmd.key));
      return {
        ...state,
        tool: {
          ...state.tool,
          commands: newCommands,
          parameters: state.tool.parameters.filter(
            (param) => !commandsToDelete.includes(param.commandKey || ""),
          ),
          exclusionGroups: state.tool.exclusionGroups?.filter(
            (group) => !commandsToDelete.includes(group.commandKey || ""),
          ),
        },
        selectedCommand:
          state.selectedCommand?.key === action.payload ? newCommands[0] : state.selectedCommand,
      };
    }

    case "UPDATE_COMMAND":
      return {
        ...state,
        tool: {
          ...state.tool,
          commands: state.tool.commands.map((cmd) => {
            if (cmd.key === action.payload.commandKey) return { ...cmd, ...action.payload.updates };
            if (action.payload.updates.isDefault) return { ...cmd, isDefault: false };
            return cmd;
          }),
        },
      };

    case "REMOVE_PARAMETER": {
      const next = {
        ...state,
        tool: {
          ...state.tool,
          parameters: state.tool.parameters.filter((p) => p.key !== action.payload),
          exclusionGroups: state.tool.exclusionGroups?.map((group) => ({
            ...group,
            parameterKeys: group.parameterKeys.filter((key) => key !== action.payload),
          })),
        },
      };
      if (state.selectedParameter?.key === action.payload) next.selectedParameter = null;
      return next;
    }

    case "SET_DIALOG_OPEN":
      return {
        ...state,
        dialogs: { ...state.dialogs, [action.payload.dialog]: action.payload.open },
      };

    case "SET_SELECTED_COMMAND":
      return { ...state, selectedCommand: action.payload };

    case "SET_SELECTED_PARAMETER":
      return { ...state, selectedParameter: action.payload };

    case "SET_EDITING_COMMAND":
      return { ...state, editingCommand: action.payload };

    case "UPSERT_PARAMETER": {
      const exists = state.tool.parameters.some((p) => p.key === action.payload.key);
      const newParameters = exists
        ? state.tool.parameters.map((param) => {
            if (param.key !== action.payload.key) return param;
            const updatedParam = {
              ...param,
              ...action.payload,
              dependencies: action.payload.dependencies || [],
              validations: action.payload.validations || [],
              enumValues: action.payload.enumValues || [],
            };
            if (action.payload.isGlobal && action.payload.isGlobal !== param.isGlobal) {
              updatedParam.commandKey = undefined;
            }
            if (action.payload.isGlobal === false && param.isGlobal) {
              updatedParam.commandKey = state.selectedCommand?.key;
            }
            return updatedParam;
          })
        : [...state.tool.parameters, action.payload];
      return { ...state, tool: { ...state.tool, parameters: newParameters } };
    }

    case "ADD_EXCLUSION_GROUP":
      return {
        ...state,
        tool: {
          ...state.tool,
          exclusionGroups: [...(state.tool.exclusionGroups ?? []), action.payload],
        },
      };

    case "UPDATE_EXCLUSION_GROUP":
      return {
        ...state,
        tool: {
          ...state.tool,
          exclusionGroups: state.tool.exclusionGroups?.map((group) =>
            group.key === action.payload.key ? action.payload : group,
          ),
        },
      };

    case "REMOVE_EXCLUSION_GROUP":
      return {
        ...state,
        tool: {
          ...state.tool,
          exclusionGroups: state.tool.exclusionGroups?.filter(
            (group) => group.key !== action.payload,
          ),
        },
      };

    case "SET_PARAMETER_VALUE":
      return {
        ...state,
        parameterValues: { ...state.parameterValues, [action.payload.key]: action.payload.value },
      };

    default:
      return state;
  }
}

interface ToolBuilderContextValue extends ToolBuilderState {
  initializeTool: (tool: Tool) => void;
  updateTool: (updates: Partial<Tool>) => void;
  addSubcommand: (parentKey?: string) => string;
  deleteCommand: (commandKey: string) => void;
  updateCommand: (commandKey: string, updates: Partial<Command>) => void;
  removeParameter: (parameterKey: string) => void;
  addExclusionGroup: (group: Omit<ExclusionGroup, "key">) => void;
  updateExclusionGroup: (updatedGroup: ExclusionGroup) => void;
  removeExclusionGroup: (groupKey: string) => void;
  setDialogOpen: (dialog: DialogKey, open: boolean) => void;
  setSelectedCommand: (command: Command) => void;
  setSelectedParameter: (parameter: Parameter | null) => void;
  setEditingCommand: (command: Command | null) => void;
  upsertParameter: (parameter: Parameter) => void;
  setParameterValue: (key: string, value: ParameterValue) => void;
  getParametersForCommand: (commandKey: string) => Parameter[];
  getGlobalParameters: () => Parameter[];
  getExclusionGroupsForCommand: (commandKey: string) => ExclusionGroup[];
}

const ToolBuilderContext = createContext<ToolBuilderContextValue | null>(null);

interface ToolBuilderProviderProps {
  tool: Tool;
  children: ReactNode;
  initialState?: Partial<ToolBuilderState>;
}

export function ToolBuilderProvider({ tool, children, initialState }: ToolBuilderProviderProps) {
  const [state, dispatch] = useReducer(toolBuilderReducer, undefined, () => ({
    ...getDefaultState(tool),
    ...initialState,
  }));

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    dispatch({ type: "INITIALIZE_TOOL", payload: tool });
  }, [tool]);

  const contextValue = useMemo(
    (): ToolBuilderContextValue => ({
      ...state,

      initializeTool: (t: Tool) => dispatch({ type: "INITIALIZE_TOOL", payload: t }),

      updateTool: (updates: Partial<Tool>) => dispatch({ type: "UPDATE_TOOL", payload: updates }),

      addSubcommand: (parentKey?: string) => {
        const newCommand = createNewCommand(parentKey);
        dispatch({ type: "ADD_SUBCOMMAND", payload: newCommand });
        toast("Command Added", { description: "New command has been created successfully." });
        return newCommand.key;
      },

      deleteCommand: (commandKey: string) => {
        dispatch({ type: "DELETE_COMMAND", payload: commandKey });
        toast("Command Deleted", {
          description: "Command and all its subcommands have been deleted.",
        });
      },

      updateCommand: (commandKey: string, updates: Partial<Command>) =>
        dispatch({ type: "UPDATE_COMMAND", payload: { commandKey, updates } }),

      removeParameter: (parameterKey: string) => {
        dispatch({ type: "REMOVE_PARAMETER", payload: parameterKey });
        toast("Parameter Deleted", { description: "Parameter has been removed successfully." });
      },

      addExclusionGroup: (group: Omit<ExclusionGroup, "key">) => {
        const newGroup: ExclusionGroup = {
          ...group,
          key: slugify(group.name),
          commandKey: state.selectedCommand?.key,
        };
        dispatch({ type: "ADD_EXCLUSION_GROUP", payload: newGroup });
        toast("Group Added", {
          description: "New exclusion group has been created successfully.",
        });
      },

      updateExclusionGroup: (updatedGroup: ExclusionGroup) => {
        dispatch({ type: "UPDATE_EXCLUSION_GROUP", payload: updatedGroup });
        toast("Group Updated", { description: "Exclusion group has been updated successfully." });
      },

      removeExclusionGroup: (groupKey: string) => {
        dispatch({ type: "REMOVE_EXCLUSION_GROUP", payload: groupKey });
        toast("Group Removed", { description: "Exclusion group has been removed successfully." });
      },

      setDialogOpen: (dialog: DialogKey, open: boolean) =>
        dispatch({ type: "SET_DIALOG_OPEN", payload: { dialog, open } }),

      setSelectedCommand: (command: Command) =>
        dispatch({ type: "SET_SELECTED_COMMAND", payload: command }),

      setSelectedParameter: (parameter: Parameter | null) =>
        dispatch({ type: "SET_SELECTED_PARAMETER", payload: parameter }),

      setEditingCommand: (command: Command | null) =>
        dispatch({ type: "SET_EDITING_COMMAND", payload: command }),

      upsertParameter: (parameter: Parameter) => {
        const exists = state.tool.parameters.some((p) => p.key === parameter.key);
        dispatch({ type: "UPSERT_PARAMETER", payload: parameter });
        if (exists) {
          toast("Parameter Updated", { description: "Parameter has been updated successfully." });
        } else {
          toast("Parameter Added", {
            description: `New ${parameter.isGlobal ? "global " : ""}parameter has been created successfully.`,
          });
        }
      },

      setParameterValue: (key: string, value: ParameterValue) =>
        dispatch({ type: "SET_PARAMETER_VALUE", payload: { key, value } }),

      getParametersForCommand: (commandKey: string) =>
        state.tool.parameters.filter((p) => !p.isGlobal && p.commandKey === commandKey),

      getGlobalParameters: () => state.tool.parameters.filter((p) => p.isGlobal),

      getExclusionGroupsForCommand: (commandKey: string) =>
        state.tool.exclusionGroups?.filter((group) => group.commandKey === commandKey) ?? [],
    }),
    [state],
  );

  return <ToolBuilderContext.Provider value={contextValue}>{children}</ToolBuilderContext.Provider>;
}

export function useToolBuilder(): ToolBuilderContextValue {
  const context = useContext(ToolBuilderContext);
  if (!context) {
    throw new Error("useToolBuilder must be used within a ToolBuilderProvider");
  }
  return context;
}

export { defaultTool };
