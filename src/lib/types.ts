import type { Tool } from "@/commandly/lib/types/flat";

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

declare module "@/commandly/lib/types/flat" {
  interface ToolMetadata {
    supportedInput: SupportedToolInputType[];
    supportedOutput: SupportedToolOutputType[];
  }
}

export interface SavedCommand {
  key: string;
  command: string;
}
