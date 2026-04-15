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
  /** Key of the parent command; used to represent subcommand nesting. */
  parentCommandKey?: string;
  /** Human-readable display name of the command. */
  name: string;
  /** Brief description of what this command does. */
  description?: string;
  /** Whether this command opens an interactive session or prompt. */
  interactive?: boolean;
  /** Display sort position relative to sibling commands. */
  sortOrder?: number;
}

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
  /** Unique identifier for this parameter within the tool. */
  key: string;
  /** Human-readable display name of the parameter. */
  name: string;
  /** Key of the command this parameter belongs to; omit for global parameters. */
  commandKey?: string;
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
  /** Whether this parameter applies to all commands rather than a single command. */
  isGlobal?: boolean;
  /** The single-character short flag (e.g. "-v"). */
  shortFlag?: string;
  /** The long-form flag or option name (e.g. "--verbose"). */
  longFlag?: string;
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
  /** Key of the command this exclusion group belongs to; omit for global groups. */
  commandKey?: string;
  /** Human-readable name for this exclusion group. */
  name: string;
  /** Whether parameters in this group are mutually exclusive or one is required. */
  exclusionType: ExclusionType;
  /** Keys of the parameters that participate in this exclusion group. */
  parameterKeys: string[];
}

export interface Tool {
  /** Unique machine-readable identifier for the tool (e.g. "httpx"). */
  name: string;
  /** Human-readable display name for the tool (e.g. "HTTPx"). */
  displayName: string;
  /** General information about the tool such as description, version, and URL. */
  info?: ToolInfo;
  /** List of all commands and subcommands defined for this tool. */
  commands: Command[];
  /** Flat list of all parameters across all commands and global scope. */
  parameters: Parameter[];
  /** Groups of parameters with mutual exclusion or required-one-of constraints. */
  exclusionGroups?: ExclusionGroup[];
  /** Arbitrary metadata attached to the tool. */
  metadata?: ToolMetadata;
}
