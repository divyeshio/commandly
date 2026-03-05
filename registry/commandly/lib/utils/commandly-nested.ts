import {
  NestedCommand,
  NestedExclusionGroup,
  NestedParameter,
  NestedTool,
} from "../types/commandly-nested";
import type { Tool, Command, Parameter } from "@/registry/commandly/lib/types/commandly";

export const convertToNestedStructure = (tool: Tool): NestedTool => {
  const globalParameters = tool.parameters.filter((p) => p.isGlobal);

  const convertParameter = (param: Parameter): NestedParameter => {
    const { ...rest } = param;
    return {
      ...rest,
      validations: param.validations?.map((v) => {
        return {
          validationType: v.validationType,
          validationValue: v.validationValue,
          errorMessage: v.errorMessage,
        };
      }),
      metadata: param.metadata,
      dataType: param.dataType,
      dependencies: param.dependencies?.map((dep) => {
        const dependsOnParam = tool.parameters.find((p) => p.key === dep.dependsOnParameterKey);
        return {
          dependsOnParameter: dependsOnParam?.longFlag || "",
          dependencyType: dep.dependencyType,
          conditionValue: dep.conditionValue,
        };
      }),
    };
  };

  const buildNestedCommands = (commands: Command[], parentKey?: string): NestedCommand[] => {
    return commands
      .filter((cmd) => cmd.parentCommandKey === parentKey)
      .map((cmd) => {
        const commandParameters = tool.parameters.filter(
          (p) => p.commandKey === cmd.key && !p.isGlobal,
        );
        return {
          name: cmd.name,
          description: cmd.description,
          isDefault: cmd.isDefault ?? false,
          sortOrder: cmd.sortOrder ?? 0,
          parameters: commandParameters.map(convertParameter),
          subcommands: buildNestedCommands(commands, cmd.key),
        };
      });
  };

  const nestedExclusionGroups: NestedExclusionGroup[] | undefined = tool.exclusionGroups?.map(
    (group) => {
      return {
        name: group.name,
        exclusionType: group.exclusionType,
        parameters: group.parameterKeys.map((pk) => {
          const param = tool.parameters.find((p) => p.key === pk);
          return param?.longFlag || "";
        }),
      };
    },
  );

  return {
    name: tool.name,
    url: tool.url,
    displayName: tool.displayName,
    description: tool.description,
    version: tool.version,
    metadata: tool.metadata,
    globalParameters: globalParameters.map(convertParameter),
    commands: buildNestedCommands(tool.commands),
    exclusionGroups: nestedExclusionGroups,
  };
};
