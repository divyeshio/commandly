import type { Tool } from "@/components/commandly/types/flat";

export const defaultTool = (toolName?: string, displayName?: string): Tool => {
  const finalToolName = toolName || "my-tool";
  return {
    binaryName: finalToolName,
    displayName: displayName || "My Tool",
    commands: [],
    parameters: [
      {
        key: "--help",
        name: "Help",
        description: "Displays help menu of tool",
        parameterType: "Flag",
        dataType: "String",
        isRequired: false,
        shortFlag: "-h",
        longFlag: "--help",
        isRepeatable: false,
      },
    ],
  };
};
