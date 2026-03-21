export interface ToolInfo {
  description?: string;
  version?: string;
  url?: string;
}

export interface Command {
  key: string;
  parentCommandKey?: string;
  name: string;
  description?: string;
  interactive?: boolean;
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

export interface ParameterEnumValues {
  values: ParameterEnumValue[];
  allowMultiple: boolean;
  separator?: string;
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
  group?: string;
  metadata?: ParameterMetadata;
  parameterType: ParameterType;
  dataType: ParameterDataType;
  isRequired: boolean;
  isRepeatable: boolean;
  isGlobal: boolean;
  shortFlag?: string;
  longFlag?: string;
  position?: number;
  sortOrder?: number;
  arraySeparator?: string;
  keyValueSeparator?: string;
  enum?: ParameterEnumValues;
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

export interface Tool {
  name: string;
  displayName: string;
  info?: ToolInfo;
  commands: Command[];
  parameters: Parameter[];
  exclusionGroups?: ExclusionGroup[];
  metadata?: ToolMetadata;
}
