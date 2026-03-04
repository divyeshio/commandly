import {
  ExclusionTypeSchema,
  ParameterDataTypeSchema,
  ParameterDependencyTypeSchema,
  ParameterEnumValueSchema,
  ParameterMetadataSchema,
  ParameterTypeSchema,
  ParameterValidationSchema,
} from "./commandly";
import { z } from "zod/v4";

export const NestedParameterEnumValueSchema = ParameterEnumValueSchema.omit({
  key: true,
  parameterKey: true,
});
export type NestedParameterEnumValue = z.infer<typeof NestedParameterEnumValueSchema>;

export const NestedParameterValidationSchema = ParameterValidationSchema.omit({
  key: true,
  parameterKey: true,
});
export type NestedParameterValidation = z.infer<typeof NestedParameterValidationSchema>;

export const NestedParameterDependencySchema = z.object({
  dependsOnParameter: z.string(),
  dependencyType: ParameterDependencyTypeSchema,
  conditionValue: z.string().optional(),
});
export type NestedParameterDependency = z.infer<typeof NestedParameterDependencySchema>;

export const NestedParameterSchema: z.ZodType<object> = z.lazy(() =>
  z.object({
    name: z.string(),
    description: z.string(),
    parameterType: ParameterTypeSchema,
    dataType: ParameterDataTypeSchema,
    metadata: ParameterMetadataSchema.optional(),
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
    enumValues: z.array(NestedParameterEnumValueSchema).optional(),
    validations: z.array(NestedParameterValidationSchema).optional(),
    dependencies: z.array(NestedParameterDependencySchema).optional(),
  }),
);
export type NestedParameter = z.infer<typeof NestedParameterSchema>;

export const NestedCommandSchema: z.ZodType<object> = z.lazy(() =>
  z.object({
    name: z.string(),
    description: z.string(),
    isDefault: z.boolean(),
    sortOrder: z.number(),
    parameters: z.array(NestedParameterSchema),
    subcommands: z.array(NestedCommandSchema),
  }),
);
export type NestedCommand = z.infer<typeof NestedCommandSchema>;

export const NestedExclusionGroupSchema = z.object({
  name: z.string(),
  exclusionType: ExclusionTypeSchema,
  parameters: z.array(z.string()),
});
export type NestedExclusionGroup = z.infer<typeof NestedExclusionGroupSchema>;

export const NestedToolMetadataSchema = z.record(z.string(), z.any());
export type NestedToolMetadata = z.infer<typeof NestedToolMetadataSchema>;

export const NestedToolSchema = z.object({
  name: z.string(),
  displayName: z.string(),
  description: z.string().optional(),
  version: z.string().optional(),
  url: z.url().optional(),
  globalParameters: z.array(NestedParameterSchema),
  commands: z.array(NestedCommandSchema),
  exclusionGroups: z.array(NestedExclusionGroupSchema).optional().nullable(),
  metadata: NestedToolMetadataSchema.optional(),
});
export type NestedTool = z.infer<typeof NestedToolSchema>;
