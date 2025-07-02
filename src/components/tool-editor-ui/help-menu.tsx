import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Command } from "@/lib/types/tool-editor";
import { useStore } from "@tanstack/react-store";
import { toolBuilderStore } from "@/components/tool-editor-ui/tool-editor.store";

export function HelpMenu() {
  const tool = useStore(toolBuilderStore, (state) => state.tool);

  const generateToolPreview = (): string => {
    const rootCommands = tool.commands.filter((cmd) => !cmd.parentCommandId);
    const globalParams = tool.parameters.filter((p) => p.isGlobal);

    let preview = `${tool.displayName}${tool.version ? ` v${tool.version}` : ""}\n`;
    preview += `${tool.description}\n\n`;

    preview += `USAGE:\n`;
    preview += `  ${tool.name} [GLOBAL OPTIONS] <COMMAND> [OPTIONS] [ARGUMENTS]\n\n`;

    if (globalParams.length > 0) {
      preview += "GLOBAL OPTIONS:\n";

      const globalFlags = globalParams.filter(
        (p) => p.parameterType === "Flag"
      );
      const globalOptions = globalParams.filter(
        (p) => p.parameterType === "Option"
      );

      globalFlags.forEach((flag) => {
        const shortFlag = flag.shortFlag ? `${flag.shortFlag}` : "";
        const longFlag = flag.longFlag ? `${flag.longFlag}` : "";
        const flagStr =
          shortFlag && longFlag
            ? `${shortFlag}, ${longFlag}`
            : shortFlag || longFlag;
        const required = flag.isRequired ? "Required: " : "";
        preview += `  ${flagStr.padEnd(20)} ${required}${flag.description}\n`;
      });

      globalOptions.forEach((option) => {
        const shortFlag = option.shortFlag ? `${option.shortFlag}` : "";
        const longFlag = option.longFlag ? `${option.longFlag}` : "";
        const flagStr =
          shortFlag && longFlag
            ? `${shortFlag}, ${longFlag}`
            : shortFlag || longFlag;
        const valueType = option.dataType.includes("array")
          ? `<value1${option.arraySeparator}value2>`
          : `<${option.dataType}>`;
        const required = option.isRequired ? "Required: " : "";
        preview += `  ${flagStr.padEnd(20)} ${required}${option.description}\n`;
        preview += `  ${" ".repeat(20)} Value: ${valueType}\n`;
      });

      preview += "\n";
    }

    preview += "COMMANDS:\n";
    const printCommand = (command: Command, level = 0) => {
      const indent = "  ".repeat(level + 1);
      preview += `${indent}${command.name.padEnd(20 - level * 2)} ${
        command.description
      }\n`;

      const commandParams = tool.parameters.filter(
        (p) => !p.isGlobal && p.commandId === command.name
      );

      const flags = commandParams.filter((p) => p.parameterType === "Flag");
      const options = commandParams.filter((p) => p.parameterType === "Option");
      const arguments_ = commandParams.filter(
        (p) => p.parameterType === "Argument"
      );

      if (flags.length > 0) {
        preview += `${indent}  Flags:\n`;
        flags.forEach((flag) => {
          const shortFlag = flag.shortFlag ? `${flag.shortFlag}` : "";
          const longFlag = flag.longFlag ? `${flag.longFlag}` : "";
          const flagStr =
            shortFlag && longFlag
              ? `${shortFlag}, ${longFlag}`
              : shortFlag || longFlag;
          const required = flag.isRequired ? "Required: " : "";
          preview += `${indent}    ${flagStr.padEnd(18)} ${required}${
            flag.description
          }\n`;
        });
      }

      if (options.length > 0) {
        preview += `${indent}  Options:\n`;
        options.forEach((option) => {
          const shortFlag = option.shortFlag ? `${option.shortFlag}` : "";
          const longFlag = option.longFlag ? `${option.longFlag}` : "";
          const flagStr =
            shortFlag && longFlag
              ? `${shortFlag}, ${longFlag}`
              : shortFlag || longFlag;
          const valueType = option.dataType.includes("array")
            ? `<value1${option.arraySeparator}value2>`
            : `<${option.dataType}>`;
          const required = option.isRequired ? "Required: " : "";
          preview += `${indent}    ${flagStr.padEnd(18)} ${required}${
            option.description
          }\n`;
          preview += `${indent}    ${" ".repeat(18)} Value: ${valueType}\n`;
        });
      }

      if (arguments_.length > 0) {
        preview += `${indent}  Arguments:\n`;
        arguments_.forEach((arg) => {
          const required = arg.isRequired ? "Required: " : "";
          preview += `${indent}    ${arg.name.padEnd(18)} ${required}${
            arg.description
          }\n`;
          if (arg.dataType === "Enum") {
            preview += `${indent}    ${" ".repeat(18)} Values: ${arg.enumValues
              .map((e) => e.value)
              .join(", ")}\n`;
          }
        });
      }

      const subcommands = tool.commands.filter(
        (cmd) => cmd.parentCommandId === command.id
      );
      if (subcommands.length > 0) {
        preview += `${indent}  Subcommands:\n`;
        subcommands.forEach((subcmd) => {
          printCommand(subcmd, level + 2);
        });
      }
    };

    rootCommands.forEach((cmd) => printCommand(cmd));

    return preview;
  };

  return (
    <ScrollArea className="bg-muted p-4 max-h-[75dvh] w-full">
      <pre className="text-sm font-mono max-h-[70dvh] w-full">
        {generateToolPreview()}
      </pre>
      <ScrollBar orientation="vertical" />
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
