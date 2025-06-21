export interface Command {
  id: string;
  parentCommand?: string;
  name: string;
  description: string;
  isDefault: boolean;
  sortOrder: number;
  subcommands: Command[];
}

export interface ParameterEnumValue {
  id: string;
  parameterId: string;
  value: string;
  displayName: string;
  description: string;
  isDefault: boolean;
  sortOrder: number;
}

export interface ParameterValidation {
  id: string;
  parameterId: string;
  validationType: ValidationType;
  validationValue: string;
  errorMessage: string;
}

export interface ParameterDependency {
  id: string;
  parameterId: string;
  dependsOnParameterId: string;
  dependencyType: DependencyType;
  conditionValue?: string;
}

export type ParameterValue = string | number | boolean;

export type ValidationType =
  | "min_length"
  | "max_length"
  | "min_value"
  | "max_value"
  | "regex";

export type DependencyType = "requires" | "conflicts_with";

export interface Parameter {
  id: string;
  name: string;
  command?: string;
  description: string;
  metadata?: ParameterMetadata;
  parameterType: ParameterType;
  dataType: ParameterDataType;
  isRequired: boolean;
  isRepeatable: boolean;
  isGlobal: boolean;
  defaultValue?: string;
  shortFlag?: string;
  longFlag: string;
  position?: number;
  sortOrder?: number;
  arraySeparator?: string;
  keyValueSeparator?: string;
  enumValues: ParameterEnumValue[];
  validations: ParameterValidation[];
  dependencies: ParameterDependency[];
}

export interface ParameterMetadata {
  tags: string[];
}

export type ParameterType = "Flag" | "Option" | "Argument";
export type ParameterDataType = "String" | "Number" | "Boolean" | "Enum";

export interface ExclusionGroup {
  id?: string;
  commandId?: string;
  name: string;
  exclusionType: ExclusionType;
  parameterIds: string[];
}

export type ExclusionType = "mutual_exclusive" | "required_one_of";

export interface SavedCommand {
  id: string;
  command: string;
}

export interface Tool {
  id?: string;
  name: string;
  displayName: string;
  description?: string;
  version?: string;
  commands: Command[];
  parameters: Parameter[];
  exclusionGroups: ExclusionGroup[];
  supportedInput: SupportedToolInputType[];
  supportedOutput: SupportedToolOutputType[];
}

export type SupportedToolInputType = "StandardInput" | "Parameter";

export type SupportedToolOutputType = "StandardOutput" | "File" | "Directory";

export interface AIParseRequest {
  helpText: string;
  toolName?: string;
}

export interface AIParseResponse {
  success: boolean;
  data?: Tool;
  error?: string;
}
