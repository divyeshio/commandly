import type { Tool, Command, Parameter } from "@/lib/types/tool-editor";
import type {
  NestedTool,
  NestedCommand,
  NestedParameter,
  NestedExclusionGroup,
} from "@/lib/types/tool-editor-nested";

// Convert flat tool structure to nested structure
export const convertToNestedStructure = (tool: Tool): NestedTool => {
  // Separate global parameters
  const globalParameters = tool.parameters.filter((p) => p.isGlobal);

  // Convert parameters to nested format
  const convertParameter = (param: Parameter): NestedParameter => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, command: commandId, ...rest } = param;
    return {
      ...rest,
      validations:
        param.validations?.map((v) => {
          return {
            validationType: v.validationType,
            validationValue: v.validationValue,
            errorMessage: v.errorMessage,
          };
        }) || [],
      metadata: param.metadata,
      dataType: param.dataType, // Map parameterDataType to dataType
      dependencies:
        param.dependencies?.map((dep) => {
          const dependsOnParam = tool.parameters.find(
            (p) => p.id === dep.dependsOnParameterId
          );
          return {
            dependsOnParameter: dependsOnParam?.longFlag || "",
            dependencyType: dep.dependencyType,
            conditionValue: dep.conditionValue,
          };
        }) || [],
    };
  };

  // Convert commands to nested structure
  const buildNestedCommands = (
    commands: Command[],
    parentId?: string
  ): NestedCommand[] => {
    return commands
      .filter((cmd) => cmd.parentCommand === parentId)
      .map((cmd) => {
        const commandParameters = tool.parameters.filter(
          (p) => p.command === cmd.id && !p.isGlobal
        );
        return {
          id: cmd.id,
          name: cmd.name,
          description: cmd.description,
          isDefault: cmd.isDefault,
          sortOrder: cmd.sortOrder,
          parameters: commandParameters.map(convertParameter),
          subcommands: buildNestedCommands(commands, cmd.id),
        };
      });
  };

  // Convert exclusion groups
  const nestedExclusionGroups: NestedExclusionGroup[] =
    tool.exclusionGroups.map((group) => {
      return {
        name: group.name,
        exclusionType: group.exclusionType,
        parameters: group.parameterIds.map((pid) => {
          const param = tool.parameters.find((p) => p.id === pid);
          return param?.longFlag || "";
        }),
      };
    });

  return {
    name: tool.name,
    displayName: tool.displayName,
    description: tool.description,
    version: tool.version,
    supportedInput: tool.supportedInput,
    supportedOutput: tool.supportedOutput,
    globalParameters: globalParameters.map(convertParameter),
    commands: buildNestedCommands(tool.commands),
    exclusionGroups: nestedExclusionGroups,
  };
};
