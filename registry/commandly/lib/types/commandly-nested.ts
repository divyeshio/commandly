import type {
  ExclusionType,
  ParameterDataType,
  ParameterDependencyType,
  ParameterMetadata,
  ParameterType,
  ParameterValidationType,
  ToolMetadata,
} from "./commandly";

export interface NestedParameterEnumValue {
  value: string;
  displayName: string;
  description?: string;
  isDefault?: boolean;
  sortOrder?: number;
}

export interface NestedParameterValidation {
  validationType: ParameterValidationType;
  validationValue: string;
  errorMessage: string;
}

export interface NestedParameterDependency {
  dependsOnParameter: string;
  dependencyType: ParameterDependencyType;
  conditionValue?: string;
}

export interface NestedParameter {
  name: string;
  description?: string;
  parameterType: ParameterType;
  dataType: ParameterDataType;
  metadata?: ParameterMetadata;
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
  enumValues?: NestedParameterEnumValue[];
  validations?: NestedParameterValidation[];
  dependencies?: NestedParameterDependency[];
}

export interface NestedCommand {
  name: string;
  description?: string;
  isDefault: boolean;
  sortOrder: number;
  parameters: NestedParameter[];
  subcommands: NestedCommand[];
}

export interface NestedExclusionGroup {
  name: string;
  exclusionType: ExclusionType;
  parameters: string[];
}

export interface NestedTool {
  name: string;
  displayName: string;
  description?: string;
  version?: string;
  url?: string;
  globalParameters: NestedParameter[];
  commands: NestedCommand[];
  exclusionGroups?: NestedExclusionGroup[] | null;
  metadata?: ToolMetadata;
}
