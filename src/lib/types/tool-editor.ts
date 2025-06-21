import { z } from "zod/v4";

// Zod schemas replacing TypeScript interfaces and types

export const CommandSchema = z.object({
  parentCommand: z.string().optional(),
  name: z.string(),
  description: z.string(),
  isDefault: z.boolean(),
  sortOrder: z.number(),
  subcommands: z.lazy(() => z.array(CommandSchema)),
});
export type Command = z.infer<typeof CommandSchema>;

export const ParameterEnumValueSchema = z.object({
  id: z.string(),
  parameterId: z.string(),
  value: z.string(),
  displayName: z.string(),
  description: z.string(),
  isDefault: z.boolean(),
  sortOrder: z.number(),
});
export type ParameterEnumValue = z.infer<typeof ParameterEnumValueSchema>;

export const ParameterValidationSchema = z.object({
  id: z.string(),
  parameterId: z.string(),
  validationType: z.enum([
    "min_length",
    "max_length",
    "min_value",
    "max_value",
    "regex",
  ]),
  validationValue: z.string(),
  errorMessage: z.string(),
});
export type ParameterValidation = z.infer<typeof ParameterValidationSchema>;

export const ParameterDependencySchema = z.object({
  id: z.string(),
  parameterId: z.string(),
  dependsOnParameterId: z.string(),
  dependencyType: z.enum(["requires", "conflicts_with"]),
  conditionValue: z.string().optional(),
});

export type ParameterValue = string | number | boolean;

export type ParameterDependency = z.infer<typeof ParameterDependencySchema>;

export const ParameterMetadataSchema = z.object({
  tags: z.array(z.string()),
});
export type ParameterMetadata = z.infer<typeof ParameterMetadataSchema>;

export const ParameterSchema = z.object({
  id: z.string(),
  name: z.string(),
  command: z.string().optional(),
  description: z.string(),
  metadata: ParameterMetadataSchema.optional(),
  parameterType: z.enum(["Flag", "Option", "Argument"]),
  dataType: z.enum(["String", "Number", "Boolean", "Enum"]),
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
  validations: z.array(ParameterValidationSchema),
  dependencies: z.array(ParameterDependencySchema),
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
