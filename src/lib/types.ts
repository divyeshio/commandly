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
