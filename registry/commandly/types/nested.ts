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
} from "@/commandly/types/flat";

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
  group?: string;
  parameterType: ParameterType;
  dataType: ParameterDataType;
  metadata?: ParameterMetadata;
  isRequired?: boolean;
  isRepeatable?: boolean;
  isGlobal?: boolean;
  shortFlag?: string;
  longFlag?: string;
  position?: number;
  sortOrder?: number;
  arraySeparator?: string;
  keyValueSeparator?: string;
  enum?: ParameterEnumValues;
  validations?: NestedParameterValidation[];
  dependencies?: NestedParameterDependency[];
}

export interface NestedCommand {
  name: string;
  description?: string;
  interactive?: boolean;
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
  $schema?: string;
  name: string;
  displayName: string;
  info?: ToolInfo;
  url?: string;
  globalParameters: NestedParameter[];
  commands: NestedCommand[];
  exclusionGroups?: NestedExclusionGroup[] | null;
  metadata?: ToolMetadata;
}
