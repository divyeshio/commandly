import { useToolBuilder } from "./tool-editor.context";
import type { Command, Parameter, Tool } from "@/components/commandly/types/flat";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const formatDescription = (description?: string) => (description?.trim() ? ` ${description}` : "");

function formatFlagStr(param: Parameter): string {
  const short = param.shortFlag ?? "";
  const long = param.longFlag ?? "";
  return short && long ? `${short}, ${long}` : short || long;
}

function formatEnumValues(param: Parameter, indent: string, pad: number): string {
  if (!param.enum?.values?.length) return "";
  const values = param.enum.values.map((e) => e.value).join(", ");
  let result = `${indent}${" ".repeat(pad)} Values: ${values}\n`;
  if (param.enum.allowMultiple) {
    result += `${indent}${" ".repeat(pad)} Multiple: yes (separator: "${param.enum.separator ?? ","}")\n`;
  }
  return result;
}

function formatValidations(param: Parameter, indent: string, pad: number): string {
  if (!param.validations?.length) return "";
  return (
    param.validations
      .map(
        (v) => `${indent}${" ".repeat(pad)} Validation: ${v.validationType}=${v.validationValue}`,
      )
      .join("\n") + "\n"
  );
}

function formatDependencies(param: Parameter, indent: string, pad: number): string {
  if (!param.dependencies?.length) return "";
  return (
    param.dependencies
      .map(
        (d) =>
          `${indent}${" ".repeat(pad)} ${d.dependencyType === "requires" ? "Requires" : "Conflicts with"}: ${d.dependsOnParameterKey}${d.conditionValue ? `=${d.conditionValue}` : ""}`,
      )
      .join("\n") + "\n"
  );
}

function formatParamDetails(param: Parameter, indent: string, pad: number): string {
  let result = "";
  if (param.dataType === "Enum" || param.enum?.values?.length) {
    result += formatEnumValues(param, indent, pad);
  }
  result += formatValidations(param, indent, pad);
  result += formatDependencies(param, indent, pad);
  return result;
}

export function generateToolPreview(tool: Tool): string {
  const rootCommands = tool.commands.filter((cmd) => !cmd.parentCommandKey);
  const globalParams = tool.parameters.filter((p) => p.isGlobal);

  let preview = `${tool.displayName}${tool.info?.version ? ` v${tool.info.version}` : ""}\n`;
  preview += `${tool.info?.description ?? ""}\n\n`;

  preview += `USAGE:\n`;
  preview += `  ${tool.binaryName} [GLOBAL OPTIONS] <COMMAND> [OPTIONS] [ARGUMENTS]\n\n`;

  if (globalParams.length > 0) {
    preview += "GLOBAL OPTIONS:\n";

    const globalFlags = globalParams.filter((p) => p.parameterType === "Flag");
    const globalOptions = globalParams.filter((p) => p.parameterType === "Option");
    const globalArguments = globalParams.filter((p) => p.parameterType === "Argument");

    globalFlags.forEach((flag) => {
      const flagStr = formatFlagStr(flag);
      const required = flag.isRequired ? "Required: " : "";
      preview += `  ${flagStr.padEnd(20)} ${required}${flag.description ?? ""}\n`;
      preview += formatParamDetails(flag, "  ", 20);
    });

    globalOptions.forEach((option) => {
      const flagStr = formatFlagStr(option);
      const valueType = option.dataType === "Enum" ? `<enum>` : `<${option.dataType}>`;
      const required = option.isRequired ? "Required: " : "";
      preview += `  ${flagStr.padEnd(20)} ${required}${option.description ?? ""}\n`;
      preview += `  ${" ".repeat(20)} Value: ${valueType}\n`;
      preview += formatParamDetails(option, "  ", 20);
    });

    globalArguments.forEach((arg) => {
      const required = arg.isRequired ? "Required: " : "";
      preview += `  ${arg.name.padEnd(20)} ${required}${arg.description ?? ""}\n`;
      preview += formatParamDetails(arg, "  ", 20);
    });

    preview += "\n";
  }

  if (rootCommands.length > 0) {
    preview += "COMMANDS:\n";
    const printCommand = (command: Command, level = 0) => {
      const indent = "  ".repeat(level + 1);
      preview += `${indent}${command.name.padEnd(20 - level * 2)}${formatDescription(command.description)}\n`;

      const commandParams = tool.parameters.filter(
        (p) => !p.isGlobal && p.commandKey === command.key,
      );

      const flags = commandParams.filter((p) => p.parameterType === "Flag");
      const options = commandParams.filter((p) => p.parameterType === "Option");
      const arguments_ = commandParams.filter((p) => p.parameterType === "Argument");

      if (flags.length > 0) {
        preview += `${indent}  Flags:\n`;
        flags.forEach((flag) => {
          const flagStr = formatFlagStr(flag);
          const required = flag.isRequired ? "Required: " : "";
          preview += `${indent}    ${flagStr.padEnd(18)} ${required}${flag.description ?? ""}\n`;
          preview += formatParamDetails(flag, `${indent}    `, 18);
        });
      }

      if (options.length > 0) {
        preview += `${indent}  Options:\n`;
        options.forEach((option) => {
          const flagStr = formatFlagStr(option);
          const valueType = option.dataType === "Enum" ? `<enum>` : `<${option.dataType}>`;
          const required = option.isRequired ? "Required: " : "";
          preview += `${indent}    ${flagStr.padEnd(18)} ${required}${option.description ?? ""}\n`;
          preview += `${indent}    ${" ".repeat(18)} Value: ${valueType}\n`;
          preview += formatParamDetails(option, `${indent}    `, 18);
        });
      }

      if (arguments_.length > 0) {
        preview += `${indent}  Arguments:\n`;
        arguments_.forEach((arg) => {
          const required = arg.isRequired ? "Required: " : "";
          preview += `${indent}    ${arg.name.padEnd(18)} ${required}${arg.description ?? ""}\n`;
          preview += formatParamDetails(arg, `${indent}    `, 18);
        });
      }

      const subcommands = tool.commands.filter((cmd) => cmd.parentCommandKey === command.key);
      if (subcommands.length > 0) {
        preview += `${indent}  Subcommands:\n`;
        subcommands.forEach((subcmd) => {
          printCommand(subcmd, level + 2);
        });
      }
    };

    rootCommands.forEach((cmd) => printCommand(cmd));
  }

  if (tool.exclusionGroups && tool.exclusionGroups.length > 0) {
    preview += "\nEXCLUSION GROUPS:\n";
    tool.exclusionGroups.forEach((group) => {
      const type =
        group.exclusionType === "mutual_exclusive" ? "Mutually exclusive" : "Required one of";
      preview += `  ${group.name}: ${type}\n`;
      preview += `    Parameters: ${group.parameterKeys.join(", ")}\n`;
    });
  }

  return preview;
}

export function HelpMenu() {
  const { tool } = useToolBuilder();

  return (
    <ScrollArea className="max-h-[75dvh] w-full rounded-xl p-4">
      <pre className="max-h-[70dvh] w-full rounded-xl p-3 font-mono text-sm">
        {generateToolPreview(tool)}
      </pre>
      <ScrollBar orientation="vertical" />
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
