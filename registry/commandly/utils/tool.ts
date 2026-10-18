import type {
  Command,
  ExclusionGroup,
  Parameter,
  ParameterValue,
  Tool,
} from "@/components/commandly/types/tool";

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

const flattenCommands = (commands: Command[], sink: Command[] = []): Command[] => {
  for (const command of commands) {
    sink.push(command);
    if (command.commands?.length) flattenCommands(command.commands, sink);
  }
  return sink;
};

/** Every command in the tool, depth-first, each parent before its children. */
export const getAllCommands = (tool: Tool): Command[] => flattenCommands(tool.commands ?? []);

/** Every command beneath `command`, depth-first. */
export const getAllSubcommands = (command: Command): Command[] =>
  flattenCommands(command.commands ?? []);

/** The command with this key anywhere in the tree. */
export const findCommand = (tool: Tool, key: string): Command | undefined =>
  getAllCommands(tool).find((command) => command.key === key);

/**
 * The command to show when the caller has not chosen one: the command named after the binary when
 * there is one, otherwise the first command in the tree.
 */
export const getDefaultCommand = (tool: Tool): Command | null => {
  const commands = getAllCommands(tool);
  return (
    commands.find(
      (command) => command.displayName.toLowerCase() === tool.binaryName.toLowerCase(),
    ) ??
    commands[0] ??
    null
  );
};

/** The chain of commands from the outermost ancestor down to the one with this key. */
export const getCommandChain = (tool: Tool, key: string): Command[] => {
  const walk = (commands: Command[], path: Command[]): Command[] | null => {
    for (const command of commands) {
      const next = [...path, command];
      if (command.key === key) return next;
      const found = walk(command.commands ?? [], next);
      if (found) return found;
    }
    return null;
  };
  return walk(tool.commands ?? [], []) ?? [];
};

export const getCommandPath = (command: Command, tool: Tool): string => {
  const chain = getCommandChain(tool, command.key);
  if (chain.length === 0) return command.displayName;
  return chain.map((step) => step.displayName).join(" ");
};

/**
 * A recursive parameter is inherited: it belongs to its command and to every command below it.
 * Root-scoped, it is inherited by the whole tree.
 */
export const isInheritedParameter = (param: Parameter): boolean => param.recursive === true;

/**
 * Resolves the parameters that apply to the currently selected command: its own parameters,
 * plus those inherited from its ancestors via `recursive`, outermost ancestor first.
 */
export const resolveApplicableParameters = (
  tool: Tool,
  selectedCommand?: Command | null,
): Parameter[] => {
  const rootParameters = tool.parameters ?? [];

  if (!selectedCommand) return rootParameters;

  // Tool-level recursive parameters are inherited by every command in the tree.
  const resolved: Parameter[] = rootParameters.filter(isInheritedParameter);
  const chain = getCommandChain(tool, selectedCommand.key);

  for (const command of chain) {
    for (const parameter of command.parameters ?? []) {
      if (command.key === selectedCommand.key || parameter.recursive) {
        resolved.push(parameter);
      }
    }
  }

  return resolved;
};

/** The parameters declared directly on a command, or on the root invocation when `commandKey` is null. */
export const getCommandParameters = (tool: Tool, commandKey: string | null): Parameter[] => {
  if (commandKey === null) return tool.parameters ?? [];
  return findCommand(tool, commandKey)?.parameters ?? [];
};

/** The exclusion groups declared directly on a command, or on the root invocation when `commandKey` is null. */
export const getExclusionGroups = (tool: Tool, commandKey: string | null): ExclusionGroup[] => {
  if (commandKey === null) return tool.exclusionGroups ?? [];
  return findCommand(tool, commandKey)?.exclusionGroups ?? [];
};

/** Every exclusion group in the tool, root invocation first, in command order. */
export const getAllExclusionGroups = (tool: Tool): ExclusionGroup[] =>
  (tool.exclusionGroups ?? []).concat(
    getAllCommands(tool).flatMap((command) => command.exclusionGroups ?? []),
  );

/** Whether a parameter's current value counts as provided. */
export const hasParameterValue = (value: ParameterValue | undefined): boolean =>
  value !== undefined &&
  value !== "" &&
  value !== false &&
  !(Array.isArray(value) && value.every((entry) => entry === ""));

/**
 * The exclusion groups that constrain a selection: those with at least one member among the
 * parameters that apply to `selectedCommand`.
 */
export const resolveExclusionGroups = (
  tool: Tool,
  selectedCommand?: Command | null,
): ExclusionGroup[] => {
  const applicable = new Set(resolveApplicableParameters(tool, selectedCommand).map((p) => p.key));
  return getAllExclusionGroups(tool).filter((group) =>
    group.parameterKeys.some((key) => applicable.has(key)),
  );
};

/**
 * The parameters a mutually exclusive group rules out, keyed by parameter, given what is
 * provided. Its members are alternatives to one another, so once one is provided every other
 * member is ruled out; the first provided member of each group keeps its place.
 */
export const excludedParameters = (
  groups: ExclusionGroup[],
  values: Record<string, ParameterValue>,
): Map<string, ExclusionGroup> => {
  const excluded = new Map<string, ExclusionGroup>();
  for (const group of groups) {
    if (group.exclusionType !== "mutual_exclusive") continue;
    const [provided] = group.parameterKeys.filter((key) => hasParameterValue(values[key]));
    if (provided === undefined) continue;
    for (const key of group.parameterKeys) {
      if (key !== provided) excluded.set(key, group);
    }
  }
  return excluded;
};

/** The parameters a `required_one_of` group makes mandatory, while none of its members is provided. */
export const requiredParameterKeys = (
  groups: ExclusionGroup[],
  values: Record<string, ParameterValue>,
): Set<string> => {
  const required = new Set<string>();
  for (const group of groups) {
    if (group.exclusionType !== "required_one_of") continue;
    if (group.parameterKeys.some((key) => hasParameterValue(values[key]))) continue;
    for (const key of group.parameterKeys) required.add(key);
  }
  return required;
};

/** Every parameter in the tool, root invocation first, in command order. */
export const getAllParameters = (tool: Tool): Parameter[] =>
  (tool.parameters ?? []).concat(
    getAllCommands(tool).flatMap((command) => command.parameters ?? []),
  );

/**
 * Rewrites a command tree bottom-up, handing `transform` each command with its children already
 * mapped. Walks that drop commands need their own traversal, since this one is one-to-one.
 */
export const mapCommandTree = (
  commands: Command[],
  transform: (command: Command) => Command,
): Command[] =>
  commands.map((command) =>
    transform(
      command.commands?.length
        ? { ...command, commands: mapCommandTree(command.commands, transform) }
        : command,
    ),
  );

/** Applies `update` to the command with `key` anywhere in the tree, leaving every other command alone. */
export const updateCommand = (
  tool: Tool,
  key: string,
  update: (command: Command) => Command,
): Tool => ({
  ...tool,
  commands: mapCommandTree(tool.commands ?? [], (command) =>
    command.key === key ? update(command) : command,
  ),
});

/** Drops the command with `key` and everything nested beneath it. */
export const removeCommand = (tool: Tool, key: string): Tool => ({
  ...tool,
  commands: dropCommand(tool.commands ?? [], key),
});

const dropCommand = (commands: Command[], key: string): Command[] =>
  commands
    .filter((command) => command.key !== key)
    .map((command) =>
      command.commands?.length
        ? { ...command, commands: dropCommand(command.commands, key) }
        : command,
    );

/**
 * Applies `update` to the parameters an owner declares: the command with `ownerKey`, or the tool's
 * own parameters when it is null. `recursive` decides where a parameter *applies*, never where it
 * is written, so this deliberately does not touch inherited parameters.
 */
export const updateParameters = (
  tool: Tool,
  ownerKey: string | null,
  update: (parameters: Parameter[]) => Parameter[],
): Tool =>
  ownerKey === null
    ? { ...tool, parameters: update(tool.parameters ?? []) }
    : updateCommand(tool, ownerKey, (command) => ({
        ...command,
        parameters: update(command.parameters ?? []),
      }));

/** Same as {@link updateParameters} for the exclusion groups an owner declares. */
export const updateExclusionGroups = (
  tool: Tool,
  ownerKey: string | null,
  update: (groups: ExclusionGroup[]) => ExclusionGroup[],
): Tool =>
  ownerKey === null
    ? { ...tool, exclusionGroups: update(tool.exclusionGroups ?? []) }
    : updateCommand(tool, ownerKey, (command) => ({
        ...command,
        exclusionGroups: update(command.exclusionGroups ?? []),
      }));

/** Drops the parameter with `key` from the set an owner declares. */
export const removeParameter = (tool: Tool, ownerKey: string | null, key: string): Tool =>
  updateParameters(tool, ownerKey, (parameters) =>
    parameters.filter((parameter) => parameter.key !== key),
  );

/** Reorders `items` so the given keys take those positions, stamping each item's `sortOrder`. */
export const reorderByKeys = <T extends { key: string; sortOrder?: number }>(
  items: T[],
  keys: string[],
): T[] => {
  const slots: number[] = [];
  const byKey = new Map<string, T>();
  const reordered = new Set(keys);

  items.forEach((item, index) => {
    byKey.set(item.key, item);
    if (reordered.has(item.key)) slots.push(index);
  });

  const next = [...items];
  keys.forEach((key, sortOrder) => {
    const slot = slots[sortOrder];
    const item = byKey.get(key);
    if (slot !== undefined && item) next[slot] = { ...item, sortOrder };
  });
  return next;
};
