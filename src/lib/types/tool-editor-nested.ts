import type {
  DependencyType,
  ExclusionType,
  ParameterDataType,
  ParameterMetadata,
  ParameterType,
  ParameterValidation,
  SupportedToolInputType,
  SupportedToolOutputType
} from "./tool-editor";

// This file contains types for nested JSON structure
export interface NestedCommand {
  name: string;
  description: string;
  isDefault: boolean;
  sortOrder: number;
  parameters: NestedParameter[];
  subcommands: NestedCommand[];
}

export interface NestedParameterEnumValue {
  value: string;
  displayName: string;
  description: string;
  isDefault: boolean;
  sortOrder: number;
}

export type NestedParameterValidation = Omit<
  ParameterValidation,
  "id" | "parameterId"
>;

export interface NestedParameterDependency {
  dependsOnParameter: string;
  dependencyType: DependencyType;
  conditionValue?: string;
}

export interface NestedParameter {
  name: string;
  description: string;
  parameterType: ParameterType;
  dataType: ParameterDataType;
  metadata?: ParameterMetadata;
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
  enumValues: NestedParameterEnumValue[];
  validations: NestedParameterValidation[];
  dependencies: NestedParameterDependency[];
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
  globalParameters: NestedParameter[];
  commands: NestedCommand[];
  exclusionGroups: NestedExclusionGroup[];
  supportedInput: SupportedToolInputType[];
  supportedOutput: SupportedToolOutputType[];
}
