import { ToolSchema } from "@/registry/commandly/lib/types/commandly";
import { z } from "zod/v4";

export const SupportedToolInputTypeSchema = z.enum(["StandardInput", "Parameter"]);
export type SupportedToolInputType = z.infer<typeof SupportedToolInputTypeSchema>;

export const SupportedToolOutputTypeSchema = z.enum(["StandardOutput", "File", "Directory"]);
export type SupportedToolOutputType = z.infer<typeof SupportedToolOutputTypeSchema>;

export const CommandlyMetadataSchema = z.object({
  supportedInput: z.array(SupportedToolInputTypeSchema),
  supportedOutput: z.array(SupportedToolOutputTypeSchema),
});
export type CommandlyMetadata = z.infer<typeof CommandlyMetadataSchema>;

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
  displayName: z.string(),
  name: z.string(),
  version: z.string().optional(),
  description: z.string().optional(),
  url: z.url().optional(),
});
export type ManualNewTool = z.infer<typeof newToolSchema>;
