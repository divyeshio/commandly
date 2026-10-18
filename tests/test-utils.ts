import type { Command, Parameter, Tool } from "@/components/commandly/types/tool";

export const defaultTool = (toolName?: string, displayName?: string): Tool => {
  const finalToolName = toolName || "my-tool";
  return {
    binaryName: finalToolName,
    displayName: displayName || "My Tool",
    commands: [],
    parameters: [
      {
        key: "help",
        displayName: "Help",
        description: "Displays help menu of tool",
        parameterType: "Flag",
        dataType: "String",
        isRequired: false,
        aliases: ["-h"],
        isRepeatable: false,
      },
    ],
  };
};

/** A parameter as the editor authors it: the key is the full flag. */
export const createTestParameter = (overrides: Partial<Parameter> = {}): Parameter => ({
  key: "--test-param-key",
  displayName: "test-param",
  description: "Test parameter description",
  parameterType: "Option",
  dataType: "String",
  isRequired: false,
  isRepeatable: false,
  aliases: ["-t", "--test"],
  ...overrides,
});

export const createTestCommand = (overrides: Partial<Command> = {}): Command => ({
  key: "test-command-key",
  displayName: "test-command",
  description: "Test command description",
  sortOrder: 0,
  ...overrides,
});
