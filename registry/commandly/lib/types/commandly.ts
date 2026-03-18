export interface Command {
  key: string;
  parentCommandKey?: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  sortOrder?: number;
}

export interface ParameterEnumValue {
  value: string;
  displayName: string;
  description?: string;
  isDefault?: boolean;
  sortOrder?: number;
}

export type ParameterValidationType =
  | "min_length"
  | "max_length"
  | "min_value"
  | "max_value"
  | "regex";

export interface ParameterValidation {
  key: string;
  validationType: ParameterValidationType;
  validationValue: string;
  errorMessage: string;
}

export type ParameterDependencyType = "requires" | "conflicts_with";

export interface ParameterDependency {
  key: string;
  parameterKey: string;
  dependsOnParameterKey: string;
  dependencyType: ParameterDependencyType;
  conditionValue?: string;
}

export type ParameterValue = string | number | boolean;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ToolMetadata {}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ParameterMetadata {
  tags?: string[];
}

export type ParameterType = "Flag" | "Option" | "Argument";

export type ParameterDataType = "String" | "Number" | "Boolean" | "Enum";

export interface Parameter {
  key: string;
  name: string;
  commandKey?: string;
  description?: string;
  metadata?: ParameterMetadata;
  parameterType: ParameterType;
  dataType: ParameterDataType;
  isRequired: boolean;
  isRepeatable: boolean;
  isGlobal: boolean;
  defaultValue?: string;
  shortFlag?: string;
  longFlag?: string;
  position?: number;
  sortOrder?: number;
  arraySeparator?: string;
  keyValueSeparator?: string;
  enumValues?: ParameterEnumValue[];
  validations?: ParameterValidation[];
  dependencies?: ParameterDependency[];
}

export type ExclusionType = "mutual_exclusive" | "required_one_of";

export interface ExclusionGroup {
  key?: string;
  commandKey?: string;
  name: string;
  exclusionType: ExclusionType;
  parameterKeys: string[];
}

export interface SavedCommand {
  key: string;
  command: string;
}

export interface Tool {
  name: string;
  displayName: string;
  description?: string;
  version?: string;
  category?: string;
  tags?: string[];
  url?: string;
  commands: Command[];
  parameters: Parameter[];
  exclusionGroups?: ExclusionGroup[];
  metadata?: ToolMetadata;
}
