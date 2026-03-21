import type { Tool } from "@/registry/commandly/lib/types/commandly";

export type SupportedToolInputType = "StandardInput" | "Parameter";

export type SupportedToolOutputType = "StandardOutput" | "File" | "Directory";

export type CommandlyMetadata = {
  supportedInput: SupportedToolInputType[];
  supportedOutput: SupportedToolOutputType[];
};

export type AIParseRequest = {
  helpText: string;
  toolName?: string;
};

export type AIParseResponse = {
  success: boolean;
  data?: Tool;
  error?: string;
};

declare module "@/registry/commandly/lib/types/commandly" {
  interface ToolMetadata {
    supportedInput: SupportedToolInputType[];
    supportedOutput: SupportedToolOutputType[];
  }
}

export interface SavedCommand {
  key: string;
  command: string;
}
