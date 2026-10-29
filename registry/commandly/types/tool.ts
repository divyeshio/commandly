export interface ToolInfo {
  /** A brief human-readable description of what the tool does. */
  description?: string;
  /** The version string of the tool (e.g. "1.0.0"). */
  version?: string;
  /** The homepage or documentation URL for the tool. */
  url?: string;
}

export interface Command {
  /** Unique identifier for this command within the tool. */
  key: string;
  /** Human-readable display name of the command. */
  displayName: string;
  /** Alternate spellings that invoke this command in place of its name. */
  aliases?: string[];
  /** Brief description of what this command does. */
  description?: string;
  /** Whether this command opens an interactive session or prompt. */
  interactive?: boolean;
  /** Display sort position relative to sibling commands. */
  sortOrder?: number;
  /** Parameters accepted by this command. Keys are unique among them. Omit for grouping commands. */
  parameters?: Parameter[];
  /** Groups of this command's parameters with mutual exclusion or required-one-of constraints. */
  exclusionGroups?: ExclusionGroup[];
  /** Subcommands nested beneath this command. */
  commands?: Command[];
}

export type InstallationMethod = "package_manager" | "binary" | "docker" | "script";

export interface InstallationSource {
  /** Unique identifier for this installation source within the tool. */
  key: string;
  /** How the tool is installed. */
  method: InstallationMethod;
  /** Package manager name, set only when method is "package_manager" (e.g. "brew", "go"). */
  manager?: string;
  /** The command that installs the tool. */
  command: string;
  /** Documentation URL describing this installation method. */
  url?: string;
  /** Platforms this installation method applies to. */
  os?: Array<"linux" | "macos" | "windows">;
  /** Additional context for this installation source. */
  note?: string;
}

export interface Installation {
  /** The list of documented ways to install the tool. */
  sources: InstallationSource[];
}

export interface InstallationMethodOption {
  method: InstallationMethod;
  /** Human-readable label for the method. */
  label: string;
}

/** The methods in presentation order; a new method must be given a position here. */
export const INSTALLATION_METHODS: InstallationMethodOption[] = [
  { method: "package_manager", label: "Package manager" },
  { method: "binary", label: "Release binary" },
  { method: "docker", label: "Docker" },
  { method: "script", label: "Script" },
];

export interface ParameterEnumValue {
  /** The raw value passed to the CLI for this choice. */
  value: string;
  /** Human-readable label shown to the user for this enum choice. */
  displayName: string;
  /** Description of what this enum value does or represents. */
  description?: string;
  /** Whether this is the default selection when no value is provided. */
  isDefault?: boolean;
  /** Display sort position relative to sibling enum values. */
  sortOrder?: number;
}

export interface ParameterEnumValues {
  /** The list of allowed enum choices. */
  values: ParameterEnumValue[];
  /** Whether the user can select multiple values at once. */
  allowMultiple?: boolean;
  /** Separator character used when joining multiple selected values. */
  separator?: string;
}

export type ParameterValidationType =
  | "min_length"
  | "max_length"
  | "min_value"
  | "max_value"
  | "regex";

export interface ParameterValidation {
  /** Unique identifier for this validation rule. */
  key: string;
  /** The type of validation to apply. */
  validationType: ParameterValidationType;
  /** The value to validate against (e.g. the max length number, or a regex pattern). */
  validationValue: string;
  /** The error message to display when validation fails. */
  errorMessage: string;
}

export type ParameterDependencyType = "requires" | "conflicts_with";

export interface ParameterDependency {
  /** Unique identifier for this dependency rule. */
  key: string;
  /** Key of the parameter that owns this dependency. */
  parameterKey: string;
  /** Key of the parameter this dependency references. */
  dependsOnParameterKey: string;
  /** Whether this parameter requires or conflicts with the referenced parameter. */
  dependencyType: ParameterDependencyType;
  /** Optional value that the referenced parameter must have for this dependency to apply. */
  conditionValue?: string;
}

export type ParameterValue = string | number | boolean | string[];

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ToolMetadata {}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ParameterMetadata {
  /** Arbitrary tags for categorising or filtering parameters. */
  tags?: string[];
}

export type ParameterType = "Flag" | "Option" | "Argument";

export type ParameterDataType = "String" | "Number" | "Boolean" | "Enum";

export interface Parameter {
  /** Unique identifier among its command's parameters. For flags and options this is the full flag, dashes included (e.g. "--output", "-list"). */
  key: string;
  /** Human-readable display name of the parameter. */
  displayName: string;
  /** Brief description of what this parameter does or accepts. */
  description?: string;
  /** Optional grouping label for organising related parameters in the UI. */
  group?: string;
  /** Additional metadata such as tags. */
  metadata?: ParameterMetadata;
  /** Whether this is a boolean flag, a key-value option, or a positional argument. */
  parameterType: ParameterType;
  /** The data type of the parameter's value. */
  dataType: ParameterDataType;
  /** Whether the user must provide this parameter. */
  isRequired?: boolean;
  /** Whether this parameter can be specified multiple times. */
  isRepeatable?: boolean;
  /** Short names and other alternate invocation forms (e.g. ["-o"]). The full flag is `key`. */
  aliases?: string[];
  /** Whether this parameter is also accessible from the subcommands of its command, recursively. */
  recursive?: boolean;
  /** Zero-based position index for positional arguments. */
  position?: number;
  /** Display sort position relative to sibling parameters. */
  sortOrder?: number;
  /** Separator character used when the option accepts multiple values in one argument (e.g. ","). */
  arraySeparator?: string;
  /** Separator between key and value for key=value style options (e.g. "="). */
  keyValueSeparator?: string;
  /** Allowed enum choices when dataType is "Enum". */
  enum?: ParameterEnumValues;
  /** Validation rules applied to this parameter's value. */
  validations?: ParameterValidation[];
  /** Dependencies on other parameters (requires or conflicts-with relationships). */
  dependencies?: ParameterDependency[];
}

export type ExclusionType = "mutual_exclusive" | "required_one_of";

export interface ExclusionGroup {
  /** Unique identifier for this exclusion group. */
  key?: string;
  /** Human-readable name for this exclusion group. */
  displayName: string;
  /** Whether parameters in this group are mutually exclusive or one is required. */
  exclusionType: ExclusionType;
  /** Keys of the parameters that participate in this exclusion group. */
  parameterKeys: string[];
}

export interface Tool {
  /** Unique binary name for the tool that it can be invoked from the command line (e.g. "httpx"). */
  binaryName: string;
  /** Human-readable display name for the tool (e.g. "HTTPx"). */
  displayName: string;
  /** Whether the root tool invocation opens an interactive session or prompt. */
  interactive?: boolean;
  /** General information about the tool such as description, version, and URL. */
  info?: ToolInfo;
  /** Structured installation instructions for the tool. */
  installation?: Installation;
  /**
   * Parameters accepted by the tool itself, before a command is chosen. A tool's own flags live
   * here; do not model the root invocation as a command named after the binary, or the root would
   * be described twice.
   */
  parameters: Parameter[];
  /** List of all commands and subcommands defined for this tool. */
  commands: Command[];
  /** Groups of the tool's own parameters with mutual exclusion or required-one-of constraints. */
  exclusionGroups?: ExclusionGroup[];
  /** Arbitrary metadata attached to the tool. */
  metadata?: ToolMetadata;
}
