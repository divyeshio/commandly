import {
  Tool,
  Command,
  Parameter,
  ExclusionGroup,
  ParameterValue,
} from "@/components/commandly/types/tool";
import {
  getAllSubcommands,
  slugify,
  getCommandParameters,
  findCommand,
  removeCommand,
  removeParameter,
  reorderByKeys,
  updateCommand,
  updateExclusionGroups,
  updateParameters,
} from "@/components/commandly/utils/tool";
import { fixTool } from "@/components/commandly/utils/tool-file";
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

export interface ContextSelection {
  commandKeys: string[];
  /**
   * Parameters the user pinned for the AI, as owner-qualified refs. A parameter `key` is only
   * unique within its own command, so the owner is part of the identity.
   */
  parameterRefs: string[];
}

const PARAMETER_REF_DELIMITER = "::";

/** The owner-qualified identity of a parameter: `ownerKey` is null for the tool's own parameters. */
export const parameterRef = (ownerKey: string | null, parameterKey: string): string =>
  `${ownerKey ?? ""}${PARAMETER_REF_DELIMITER}${parameterKey}`;

/** Splits a {@link parameterRef} back into its owner and parameter key. */
export const parseParameterRef = (
  ref: string,
): { ownerKey: string | null; parameterKey: string } => {
  const delimiterAt = ref.indexOf(PARAMETER_REF_DELIMITER);
  if (delimiterAt === -1) return { ownerKey: null, parameterKey: ref };
  const ownerKey = ref.slice(0, delimiterAt);
  return {
    ownerKey: ownerKey === "" ? null : ownerKey,
    parameterKey: ref.slice(delimiterAt + PARAMETER_REF_DELIMITER.length),
  };
};

/** Resolves owner-qualified refs to the parameters they point at, dropping stale ones. */
export const resolveContextParameters = (
  tool: Tool,
  refs: string[],
): { ref: string; parameter: Parameter }[] =>
  refs.flatMap((ref) => {
    const { ownerKey, parameterKey } = parseParameterRef(ref);
    const parameter = getCommandParameters(tool, ownerKey).find(
      (item) => item.key === parameterKey,
    );
    return parameter ? [{ ref, parameter }] : [];
  });

export interface ToolBuilderState {
  tool: Tool;
  originalTool: Tool;
  /**
   * The command whose parameters are currently being edited, or null while the tool's own
   * parameters are. Every parameter and exclusion-group write targets this owner.
   */
  selectedCommandKey: string | null;
  selectedParameter: Parameter | null;
  contextSelection: ContextSelection;
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
  | { type: "ADD_SUBCOMMAND"; payload: { command: Command; parentKey: string | null } }
  | { type: "DELETE_COMMAND"; payload: string }
  | { type: "UPDATE_COMMAND"; payload: { commandKey: string; updates: Partial<Command> } }
  | { type: "REMOVE_PARAMETER"; payload: { parameterKey: string } }
  | { type: "SET_DIALOG_OPEN"; payload: { dialog: DialogKey; open: boolean } }
  | { type: "SET_SELECTED_COMMAND"; payload: string | null }
  | { type: "SET_SELECTED_PARAMETER"; payload: Parameter | null }
  | { type: "SET_CONTEXT_SELECTION"; payload: ContextSelection }
  | { type: "CLEAR_CONTEXT_SELECTION" }
  | {
      type: "UPSERT_PARAMETER";
      payload: { parameter: Parameter; originalKey?: string; isNew: boolean };
    }
  | { type: "ADD_EXCLUSION_GROUP"; payload: { group: ExclusionGroup } }
  | {
      type: "UPDATE_EXCLUSION_GROUP";
      payload: { group: ExclusionGroup };
    }
  | { type: "REMOVE_EXCLUSION_GROUP"; payload: { groupKey: string } }
  | { type: "SET_PARAMETER_VALUE"; payload: { key: string; value: ParameterValue } }
  | { type: "REORDER_COMMANDS"; payload: { commandKeys: string[]; parentKey: string | null } }
  | { type: "REORDER_PARAMETERS"; payload: { parameterKeys: string[] } };

/** Appends `command` to the children its parent owns, or to the tool's own commands when null. */
const addCommandTo = (tool: Tool, command: Command, parentKey: string | null): Tool =>
  parentKey === null
    ? { ...tool, commands: [...(tool.commands ?? []), command] }
    : updateCommand(tool, parentKey, (parent) => ({
        ...parent,
        commands: [...(parent.commands ?? []), command],
      }));

/** Reorders the commands a parent owns, or the tool's own when null. */
const reorderCommandsWithin = (
  tool: Tool,
  commandKeys: string[],
  parentKey: string | null,
): Tool =>
  parentKey === null
    ? { ...tool, commands: reorderByKeys(tool.commands ?? [], commandKeys) }
    : updateCommand(tool, parentKey, (parent) => ({
        ...parent,
        commands: reorderByKeys(parent.commands ?? [], commandKeys),
      }));

function getDefaultState(tool: Tool): ToolBuilderState {
  const cleanTool = fixTool(tool);
  return {
    tool: cleanTool,
    originalTool: cleanTool,
    selectedCommandKey: null,
    selectedParameter: null,
    contextSelection: { commandKeys: [], parameterRefs: [] },
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
      return getDefaultState(action.payload);

    case "UPDATE_TOOL":
      return { ...state, tool: fixTool({ ...state.tool, ...action.payload }) };

    case "ADD_SUBCOMMAND": {
      const { command, parentKey } = action.payload;
      return { ...state, tool: addCommandTo(state.tool, command, parentKey) };
    }

    case "DELETE_COMMAND": {
      const target = findCommand(state.tool, action.payload);
      const removedKeys = new Set(
        target
          ? [target.key, ...getAllSubcommands(target).map((command) => command.key)]
          : [action.payload],
      );
      const tool = removeCommand(state.tool, action.payload);
      return {
        ...state,
        tool,
        contextSelection: {
          ...state.contextSelection,
          commandKeys: state.contextSelection.commandKeys.filter((key) => !removedKeys.has(key)),
          parameterRefs: state.contextSelection.parameterRefs.filter((ref) => {
            const { ownerKey } = parseParameterRef(ref);
            return ownerKey === null || !removedKeys.has(ownerKey);
          }),
        },
        selectedCommandKey:
          state.selectedCommandKey && removedKeys.has(state.selectedCommandKey)
            ? (tool.commands[0]?.key ?? null)
            : state.selectedCommandKey,
      };
    }

    case "UPDATE_COMMAND": {
      const { commandKey, updates } = action.payload;
      const tool = updateCommand(state.tool, commandKey, (command) => ({ ...command, ...updates }));
      const renamedKey = updates.key;
      if (renamedKey === undefined || renamedKey === commandKey) return { ...state, tool };
      return {
        ...state,
        tool,
        selectedCommandKey:
          state.selectedCommandKey === commandKey ? renamedKey : state.selectedCommandKey,
        contextSelection: {
          ...state.contextSelection,
          commandKeys: state.contextSelection.commandKeys.map((key) =>
            key === commandKey ? renamedKey : key,
          ),
          parameterRefs: state.contextSelection.parameterRefs.map((ref) => {
            const { ownerKey, parameterKey } = parseParameterRef(ref);
            return ownerKey === commandKey ? parameterRef(renamedKey, parameterKey) : ref;
          }),
        },
      };
    }

    case "REMOVE_PARAMETER": {
      const { parameterKey } = action.payload;
      const ownerKey = state.selectedCommandKey;
      const next: ToolBuilderState = {
        ...state,
        tool: updateExclusionGroups(
          removeParameter(state.tool, ownerKey, parameterKey),
          ownerKey,
          (groups) =>
            groups.map((group) => ({
              ...group,
              parameterKeys: group.parameterKeys.filter((key) => key !== parameterKey),
            })),
        ),
        contextSelection: {
          ...state.contextSelection,
          parameterRefs: state.contextSelection.parameterRefs.filter(
            (ref) => ref !== parameterRef(ownerKey, parameterKey),
          ),
        },
      };
      if (state.selectedParameter?.key === parameterKey) next.selectedParameter = null;
      return next;
    }

    case "SET_DIALOG_OPEN":
      return {
        ...state,
        dialogs: { ...state.dialogs, [action.payload.dialog]: action.payload.open },
      };

    case "SET_SELECTED_COMMAND":
      return { ...state, selectedCommandKey: action.payload };

    case "SET_SELECTED_PARAMETER":
      return { ...state, selectedParameter: action.payload };

    case "UPSERT_PARAMETER": {
      const { parameter, originalKey, isNew } = action.payload;
      const matchKey = originalKey ?? parameter.key;
      return {
        ...state,
        tool: updateParameters(state.tool, state.selectedCommandKey, (siblings) =>
          isNew
            ? [...siblings, parameter]
            : siblings.map((existing) =>
                existing.key === matchKey ? { ...existing, ...parameter } : existing,
              ),
        ),
      };
    }

    case "ADD_EXCLUSION_GROUP":
      return {
        ...state,
        tool: updateExclusionGroups(state.tool, state.selectedCommandKey, (groups) => [
          ...groups,
          action.payload.group,
        ]),
      };

    case "UPDATE_EXCLUSION_GROUP":
      return {
        ...state,
        tool: updateExclusionGroups(state.tool, state.selectedCommandKey, (groups) =>
          groups.map((group) =>
            group.key === action.payload.group.key ? action.payload.group : group,
          ),
        ),
      };

    case "REMOVE_EXCLUSION_GROUP":
      return {
        ...state,
        tool: updateExclusionGroups(state.tool, state.selectedCommandKey, (groups) =>
          groups.filter((group) => group.key !== action.payload.groupKey),
        ),
      };

    case "SET_PARAMETER_VALUE":
      return {
        ...state,
        parameterValues: { ...state.parameterValues, [action.payload.key]: action.payload.value },
      };

    case "REORDER_COMMANDS": {
      const { commandKeys, parentKey } = action.payload;
      return { ...state, tool: reorderCommandsWithin(state.tool, commandKeys, parentKey) };
    }

    case "REORDER_PARAMETERS": {
      const { parameterKeys } = action.payload;
      return {
        ...state,
        tool: updateParameters(state.tool, state.selectedCommandKey, (parameters) =>
          reorderByKeys(parameters, parameterKeys),
        ),
      };
    }

    case "SET_CONTEXT_SELECTION":
      return { ...state, contextSelection: action.payload };

    case "CLEAR_CONTEXT_SELECTION":
      return { ...state, contextSelection: { commandKeys: [], parameterRefs: [] } };

    default:
      return state;
  }
}

interface ToolBuilderContextValue extends ToolBuilderState {
  /** The selected command, resolved from the tree so it can never go stale. */
  selectedCommand: Command | null;
  initializeTool: (tool: Tool) => void;
  updateTool: (updates: Partial<Tool>) => void;
  addCommand: (command: Command, parentKey: string | null) => void;
  deleteCommand: (commandKey: string) => void;
  updateCommand: (commandKey: string, updates: Partial<Command>) => void;
  removeParameter: (parameterKey: string) => void;
  addExclusionGroup: (group: Omit<ExclusionGroup, "key">) => void;
  updateExclusionGroup: (updatedGroup: ExclusionGroup) => void;
  removeExclusionGroup: (groupKey: string) => void;
  setDialogOpen: (dialog: DialogKey, open: boolean) => void;
  setSelectedCommandKey: (commandKey: string | null) => void;
  setSelectedParameter: (parameter: Parameter | null) => void;
  setContextSelection: (selection: ContextSelection) => void;
  clearContextSelection: () => void;
  upsertParameter: (parameter: Parameter, originalKey?: string) => void;
  setParameterValue: (key: string, value: ParameterValue) => void;
  reorderCommands: (commandKeys: string[], parentKey: string | null) => void;
  reorderParameters: (parameterKeys: string[]) => void;
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

  const contextValue = useMemo((): ToolBuilderContextValue => {
    const ownerKey = state.selectedCommandKey;
    return {
      ...state,
      selectedCommand: ownerKey === null ? null : (findCommand(state.tool, ownerKey) ?? null),

      initializeTool: (t: Tool) => dispatch({ type: "INITIALIZE_TOOL", payload: t }),

      updateTool: (updates: Partial<Tool>) => dispatch({ type: "UPDATE_TOOL", payload: updates }),

      addCommand: (command: Command, parentKey: string | null) => {
        dispatch({ type: "ADD_SUBCOMMAND", payload: { command, parentKey } });
        toast("Command Added", { description: "New command has been created successfully." });
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
        dispatch({ type: "REMOVE_PARAMETER", payload: { parameterKey } });
        toast("Parameter Deleted", { description: "Parameter has been removed successfully." });
      },

      addExclusionGroup: (group: Omit<ExclusionGroup, "key">) => {
        const newGroup: ExclusionGroup = {
          ...group,
          key: slugify(group.displayName),
        };
        dispatch({ type: "ADD_EXCLUSION_GROUP", payload: { group: newGroup } });
        toast("Group Added", {
          description: "New exclusion group has been created successfully.",
        });
      },

      updateExclusionGroup: (updatedGroup: ExclusionGroup) => {
        dispatch({ type: "UPDATE_EXCLUSION_GROUP", payload: { group: updatedGroup } });
        toast("Group Updated", { description: "Exclusion group has been updated successfully." });
      },

      removeExclusionGroup: (groupKey: string) => {
        dispatch({ type: "REMOVE_EXCLUSION_GROUP", payload: { groupKey } });
        toast("Group Removed", { description: "Exclusion group has been removed successfully." });
      },

      setDialogOpen: (dialog: DialogKey, open: boolean) =>
        dispatch({ type: "SET_DIALOG_OPEN", payload: { dialog, open } }),

      setSelectedCommandKey: (commandKey: string | null) =>
        dispatch({ type: "SET_SELECTED_COMMAND", payload: commandKey }),

      setSelectedParameter: (parameter: Parameter | null) =>
        dispatch({ type: "SET_SELECTED_PARAMETER", payload: parameter }),

      setContextSelection: (selection: ContextSelection) =>
        dispatch({ type: "SET_CONTEXT_SELECTION", payload: selection }),

      clearContextSelection: () => dispatch({ type: "CLEAR_CONTEXT_SELECTION" }),

      upsertParameter: (parameter: Parameter, originalKey?: string) => {
        const matchKey = originalKey ?? parameter.key;
        const isNew = !getCommandParameters(state.tool, ownerKey).some(
          (existing) => existing.key === matchKey,
        );
        dispatch({ type: "UPSERT_PARAMETER", payload: { parameter, originalKey, isNew } });
        if (isNew) {
          toast("Parameter Added", {
            description: `New ${ownerKey ? "" : "tool "}parameter has been created successfully.`,
          });
        } else {
          toast("Parameter Updated", { description: "Parameter has been updated successfully." });
        }
      },

      setParameterValue: (key: string, value: ParameterValue) =>
        dispatch({ type: "SET_PARAMETER_VALUE", payload: { key, value } }),

      reorderCommands: (commandKeys: string[], parentKey: string | null) =>
        dispatch({ type: "REORDER_COMMANDS", payload: { commandKeys, parentKey } }),

      reorderParameters: (parameterKeys: string[]) =>
        dispatch({ type: "REORDER_PARAMETERS", payload: { parameterKeys } }),
    };
  }, [state]);

  return <ToolBuilderContext.Provider value={contextValue}>{children}</ToolBuilderContext.Provider>;
}

export function useToolBuilder(): ToolBuilderContextValue {
  const context = useContext(ToolBuilderContext);
  if (!context) {
    throw new Error("useToolBuilder must be used within a ToolBuilderProvider");
  }
  return context;
}
