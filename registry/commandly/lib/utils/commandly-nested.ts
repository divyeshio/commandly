import type {
  Tool,
  Command,
  Parameter
} from "@/registry/commandly/lib/types/commandly";
import { NestedCommand, NestedExclusionGroup, NestedParameter, NestedTool } from "../types/commandly-nested";


export const convertToNestedStructure = (tool: Tool): NestedTool => {
  const globalParameters = tool.parameters.filter((p) => p.isGlobal);

  const convertParameter = (param: Parameter): NestedParameter => {
    const { id, commandId, ...rest } = param;
    return {
      ...rest,
      validations:
        param.validations?.map((v) => {
          return {
            validationType: v.validationType,
            validationValue: v.validationValue,
            errorMessage: v.errorMessage
          };
        }) || [],
      metadata: param.metadata,
      dataType: param.dataType,
      dependencies:
        param.dependencies?.map((dep) => {
          const dependsOnParam = tool.parameters.find(
            (p) => p.id === dep.dependsOnParameterId
          );
          return {
            dependsOnParameter: dependsOnParam?.longFlag || "",
            dependencyType: dep.dependencyType,
            conditionValue: dep.conditionValue
          };
        }) || []
    };
  };

  const buildNestedCommands = (
    commands: Command[],
    parentId?: string
  ): NestedCommand[] => {
    return commands
      .filter((cmd) => cmd.parentCommandId === parentId)
      .map((cmd) => {
        const commandParameters = tool.parameters.filter(
          (p) => p.commandId === cmd.id && !p.isGlobal
        );
        return {
          name: cmd.name,
          description: cmd.description,
          isDefault: cmd.isDefault,
          sortOrder: cmd.sortOrder,
          parameters: commandParameters.map(convertParameter),
          subcommands: buildNestedCommands(commands, cmd.id)
        };
      });
  };

  const nestedExclusionGroups: NestedExclusionGroup[] =
    tool.exclusionGroups.map((group) => {
      return {
        name: group.name,
        exclusionType: group.exclusionType,
        parameters: group.parameterIds.map((pid) => {
          const param = tool.parameters.find((p) => p.id === pid);
          return param?.longFlag || "";
        })
      };
    });

  return {
    name: tool.name,
    url: tool.url,
    displayName: tool.displayName,
    description: tool.description,
    version: tool.version,
    supportedInput: tool.supportedInput,
    supportedOutput: tool.supportedOutput,
    globalParameters: globalParameters.map(convertParameter),
    commands: buildNestedCommands(tool.commands),
    exclusionGroups: nestedExclusionGroups
  };
};
