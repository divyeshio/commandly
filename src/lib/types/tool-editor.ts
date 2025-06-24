import { z } from "zod/v4";

export const CommandSchema = z.object({
  id: z.uuidv7(),
  parentCommand: z.string().optional(),
  name: z.string(),
  description: z.string(),
  isDefault: z.boolean(),
  sortOrder: z.number(),
  subcommands: z.lazy(() => z.array(CommandSchema).optional()),
});
export type Command = z.infer<typeof CommandSchema>;

export const ParameterEnumValueSchema = z.object({
  id: z.uuidv7(),
  parameterId: z.uuidv7(),
  value: z.string(),
  displayName: z.string(),
  description: z.string(),
  isDefault: z.boolean(),
  sortOrder: z.number(),
});
export type ParameterEnumValue = z.infer<typeof ParameterEnumValueSchema>;

export const ParameterValidationTypeSchema = z.enum([
  "min_length",
  "max_length",
  "min_value",
  "max_value",
  "regex",
]);
export type ParameterValidationType = z.infer<
  typeof ParameterValidationTypeSchema
>;

export const ParameterValidationSchema = z.object({
  id: z.string(),
  parameterId: z.string(),
  validationType: ParameterValidationTypeSchema,
  validationValue: z.string(),
  errorMessage: z.string(),
});
export type ParameterValidation = z.infer<typeof ParameterValidationSchema>;
export const ParameterDependencyTypeSchema = z.enum([
  "requires",
  "conflicts_with",
]);
export type ParameterDependencyType = z.infer<
  typeof ParameterDependencyTypeSchema
>;
export const ParameterDependencySchema = z.object({
  id: z.string(),
  parameterId: z.string(),
  dependsOnParameterId: z.string(),
  dependencyType: ParameterDependencyTypeSchema,
  conditionValue: z.string().optional(),
});

export type ParameterValue = string | number | boolean;

export type ParameterDependency = z.infer<typeof ParameterDependencySchema>;

export const ParameterMetadataSchema = z.object({
  tags: z.array(z.string()).optional(),
});
export type ParameterMetadata = z.infer<typeof ParameterMetadataSchema>;
export const ParameterTypeSchema = z.enum(["Flag", "Option", "Argument"]);
export type ParameterType = z.infer<typeof ParameterTypeSchema>;

export const ParameterDataTypeSchema = z.enum([
  "String",
  "Number",
  "Boolean",
  "Enum",
]);
export type ParameterDataType = z.infer<typeof ParameterDataTypeSchema>;

export const ParameterSchema = z.object({
  id: z.string(),
  name: z.string(),
  command: z.string().optional(),
  description: z.string(),
  metadata: ParameterMetadataSchema.optional(),
  parameterType: ParameterTypeSchema,
  dataType: ParameterDataTypeSchema,
  isRequired: z.boolean(),
  isRepeatable: z.boolean(),
  isGlobal: z.boolean(),
  defaultValue: z.string().optional(),
  shortFlag: z.string().optional(),
  longFlag: z.string(),
  position: z.number().optional(),
  sortOrder: z.number().optional(),
  arraySeparator: z.string().optional(),
  keyValueSeparator: z.string().optional(),
  enumValues: z.array(ParameterEnumValueSchema),
  validations: z.array(ParameterValidationSchema).optional(),
  dependencies: z.array(ParameterDependencySchema).optional(),
});
export type Parameter = z.infer<typeof ParameterSchema>;

export const ExclusionGroupSchema = z.object({
  id: z.string().optional(),
  commandId: z.string().optional(),
  name: z.string(),
  exclusionType: z.enum(["mutual_exclusive", "required_one_of"]),
  parameterIds: z.array(z.string()),
});
export type ExclusionGroup = z.infer<typeof ExclusionGroupSchema>;

export const SavedCommandSchema = z.object({
  id: z.string(),
  command: z.string(),
});
export type SavedCommand = z.infer<typeof SavedCommandSchema>;

export const ToolSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  displayName: z.string(),
  description: z.string().optional(),
  version: z.string().optional(),
  commands: z.array(CommandSchema),
  parameters: z.array(ParameterSchema),
  exclusionGroups: z.array(ExclusionGroupSchema),
  supportedInput: z.array(z.enum(["StandardInput", "Parameter"])),
  supportedOutput: z.array(z.enum(["StandardOutput", "File", "Directory"])),
});
export type Tool = z.infer<typeof ToolSchema>;

export const AIParseRequestSchema = z.object({
  helpText: z.string(),
  toolName: z.string().optional(),
});
export type AIParseRequest = z.infer<typeof AIParseRequestSchema>;

export const AIParseResponseSchema = z.object({
  success: z.boolean(),
  data: ToolSchema.optional(),
  error: z.string().optional(),
});
export type AIParseResponse = z.infer<typeof AIParseResponseSchema>;

export const newToolSchema = z.object({
  displayName: z.string().optional(),
  name: z.string().optional(),
  version: z.string().optional(),
  description: z.string().optional(),
});
export type NewTool = z.infer<typeof newToolSchema>;
