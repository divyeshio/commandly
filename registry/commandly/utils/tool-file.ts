import type { Command, ExclusionGroup, Parameter, Tool } from "@/components/commandly/types/tool";
import { mapCommandTree, slugify } from "@/components/commandly/utils/tool";

/** URL of the published JSON Schema for tool files, written to `$schema` on export. */
export const SCHEMA_URL = "https://commandly.divyeshio.in/specification/tool.json";

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

/**
 * How a tool is normalised for output. The published JSON keeps the defaults the user typed; the
 * file written to disk drops them.
 */
interface CleanToolOptions {
  /** Drop `metadata`, which the published JSON does not carry. */
  removeMetadata: boolean;
  /** Drop fields whose value already encodes the default. */
  removeDefaults: boolean;
}

function cleanParameter(param: Parameter, options: CleanToolOptions): Parameter {
  const cleaned: Parameter = { ...param };

  if (options.removeDefaults) {
    if (cleaned.isRequired === false) delete cleaned.isRequired;
    if (cleaned.isRepeatable === false) delete cleaned.isRepeatable;
    if (cleaned.recursive === false) delete cleaned.recursive;
    if (cleaned.keyValueSeparator === " ") delete cleaned.keyValueSeparator;
    if (cleaned.arraySeparator === "," && cleaned.isRepeatable !== true)
      delete cleaned.arraySeparator;

    if (isEmptyArray(cleaned.aliases)) delete cleaned.aliases;
    if (!cleaned.enum || isEmptyArray(cleaned.enum.values)) delete cleaned.enum;
    if (isEmptyArray(cleaned.validations)) delete cleaned.validations;
    if (isEmptyArray(cleaned.dependencies)) delete cleaned.dependencies;
  }

  if (options.removeMetadata) {
    delete cleaned.metadata;
  } else if (cleaned.metadata) {
    const metadata = { ...cleaned.metadata };
    if (isEmptyArray(metadata.tags)) delete metadata.tags;
    if (isEmptyObject(metadata)) delete cleaned.metadata;
    else cleaned.metadata = metadata;
  }

  return cleaned;
}

function cleanCommandTree(commands: Command[], options: CleanToolOptions): Command[] {
  return mapCommandTree(commands, (command) => {
    const cleaned: Command = { ...command };

    if (options.removeDefaults) {
      if (cleaned.interactive === false) delete cleaned.interactive;
      if (cleaned.exclusionGroups?.length === 0) delete cleaned.exclusionGroups;
    }
    if (cleaned.parameters) {
      cleaned.parameters = cleaned.parameters.map((param) => cleanParameter(param, options));
    }
    if (cleaned.commands?.length === 0) delete cleaned.commands;

    return cleaned;
  });
}

/** The published JSON: the user's defaults are kept, `metadata` is dropped. */
const EXPORT_OPTIONS: CleanToolOptions = { removeMetadata: true, removeDefaults: false };

export const exportToStructuredJSON = (tool: Tool) => ({
  $schema: SCHEMA_URL,
  binaryName: tool.binaryName,
  displayName: tool.displayName,
  interactive: tool.interactive,
  info: tool.info,
  installation: tool.installation,
  parameters: tool.parameters.map((param) => cleanParameter(param, EXPORT_OPTIONS)),
  commands: cleanCommandTree(tool.commands, EXPORT_OPTIONS),
  exclusionGroups: tool.exclusionGroups,
  metadata: tool.metadata,
});

/** The tool as it is written to disk or published: `$schema` is added on request. */
export type ToolFile = Tool & { $schema?: string };

export interface FixToolOptions {
  addSchema?: boolean;
  removeMetadata?: boolean;
}

/** Normalises a tool into the shape the specification expects, dropping defaults that say nothing. */
export function fixTool(tool: Tool, options?: FixToolOptions): ToolFile {
  const cleanOptions: CleanToolOptions = {
    removeMetadata: options?.removeMetadata ?? false,
    removeDefaults: true,
  };

  const cleaned: ToolFile = { ...tool };

  if (options?.addSchema) cleaned.$schema = SCHEMA_URL;
  if (cleaned.interactive === false) delete cleaned.interactive;
  if (cleanOptions.removeMetadata || isEmptyObject(cleaned.metadata)) delete cleaned.metadata;
  if (isEmptyArray(cleaned.exclusionGroups)) delete cleaned.exclusionGroups;
  if (isEmptyArray(cleaned.installation?.sources)) delete cleaned.installation;

  cleaned.parameters = (cleaned.parameters ?? []).map((param) =>
    cleanParameter(param, cleanOptions),
  );
  cleaned.commands = cleanCommandTree(cleaned.commands ?? [], cleanOptions);

  return cleaned;
}

/** A group always needs a key: that is how the editor finds it again to edit or remove it. */
const slugifyGroupKey = (group: ExclusionGroup): ExclusionGroup => ({
  ...group,
  key: slugify(group.displayName),
});

/**
 * Rebuilds the keys a generated tool may have drifted on: command and exclusion-group keys become
 * slugs of their display names. Parameter keys are the flags themselves, so they are left alone.
 */
export const normalizeKeys = (tool: Tool): Tool => ({
  ...tool,
  ...(tool.exclusionGroups ? { exclusionGroups: tool.exclusionGroups.map(slugifyGroupKey) } : {}),
  commands: mapCommandTree(tool.commands ?? [], (command) => ({
    ...command,
    key: slugify(command.displayName),
    ...(command.exclusionGroups
      ? { exclusionGroups: command.exclusionGroups.map(slugifyGroupKey) }
      : {}),
  })),
});
