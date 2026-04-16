import type {
  ExclusionType,
  ParameterDataType,
  ParameterDependencyType,
  ParameterEnumValues,
  ParameterMetadata,
  ParameterType,
  ParameterValidationType,
  ToolInfo,
  ToolMetadata,
} from "@/components/commandly/types/flat";

export interface NestedParameterValidation {
  /** The type of validation to apply. */
  validationType: ParameterValidationType;
  /** The value to validate against (e.g. max length number or regex pattern). */
  validationValue: string;
  /** The error message to display when validation fails. */
  errorMessage: string;
}

export interface NestedParameterDependency {
  /** Name of the parameter this dependency references. */
  dependsOnParameter: string;
  /** Whether this parameter requires or conflicts with the referenced parameter. */
  dependencyType: ParameterDependencyType;
  /** Optional value that the referenced parameter must have for this dependency to apply. */
  conditionValue?: string;
}

export interface NestedParameter {
  /** Human-readable display name of the parameter. */
  name: string;
  /** Brief description of what this parameter does or accepts. */
  description?: string;
  /** Optional grouping label for organising related parameters in the UI. */
  group?: string;
  /** Whether this is a boolean flag, a key-value option, or a positional argument. */
  parameterType: ParameterType;
  /** The data type of the parameter's value. */
  dataType: ParameterDataType;
  /** Additional metadata such as tags. */
  metadata?: ParameterMetadata;
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
  validations?: NestedParameterValidation[];
  /** Dependencies on other parameters (requires or conflicts-with relationships). */
  dependencies?: NestedParameterDependency[];
}

export interface NestedCommand {
  /** Human-readable display name of the command. */
  name: string;
  /** Brief description of what this command does. */
  description?: string;
  /** Whether this command opens an interactive session or prompt. */
  interactive?: boolean;
  /** Display sort position relative to sibling commands. */
  sortOrder?: number;
  /** Parameters that belong directly to this command. */
  parameters: NestedParameter[];
  /** Nested subcommands of this command. */
  subcommands: NestedCommand[] /** Groups of parameters with mutual exclusion or required-one-of constraints scoped to this command. */;
  exclusionGroups?: NestedExclusionGroup[];
}

export interface NestedExclusionGroup {
  /** Human-readable name for this exclusion group. */
  name: string;
  /** Whether parameters in this group are mutually exclusive or one is required. */
  exclusionType: ExclusionType;
  /** Names of the parameters that participate in this exclusion group. */
  parameters: string[];
}

export interface NestedTool {
  $schema?: string;
  /** Unique binary name for the tool that it can be invoked from the command line (e.g. "httpx"). */
  binaryName: string;
  /** Human-readable display name for the tool (e.g. "HTTPx"). */
  displayName: string;
  /** General information about the tool such as description, version, and URL. */
  info?: ToolInfo;
  /** The homepage or documentation URL for the tool. */
  url?: string;
  /** Parameters that belong to the root invocation when no commands exist. */
  rootParameters: NestedParameter[];
  /** Parameters that apply to all commands globally. */
  globalParameters: NestedParameter[];
  /** Hierarchical list of commands and their nested subcommands. */
  commands: NestedCommand[];
  /** Groups of parameters with mutual exclusion or required-one-of constraints. */
  exclusionGroups?: NestedExclusionGroup[] | null;
  /** Arbitrary metadata attached to the tool. */
  metadata?: ToolMetadata;
}
