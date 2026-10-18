import { defaultTool } from "../test-utils";
import type { Tool } from "@/components/commandly/types/tool";
import { generateToolPreview, HelpMenu } from "@/components/tool-editor/help-menu";
import { ToolBuilderProvider } from "@/components/tool-editor/tool-editor.context";
import { render, screen } from "@testing-library/react";

/** Builds a single-command tool whose options live on the "run" command. */
const toolWithOptions = (parameters: Tool["parameters"]): Tool => ({
  binaryName: "tool",
  displayName: "Tool",
  commands: [{ key: "run", displayName: "run", parameters }],
  parameters: [],
});

describe("HelpMenu", () => {
  it("renders tool name and description", () => {
    render(
      <ToolBuilderProvider tool={defaultTool("tool", "Tool")}>
        <HelpMenu />
      </ToolBuilderProvider>,
    );
    expect(screen.getByText(/Tool/)).toBeInTheDocument();
  });

  it("does not render undefined when descriptions are missing", () => {
    const tool: Tool = {
      binaryName: "tool",
      displayName: "Tool",
      commands: [
        {
          key: "tool",
          displayName: "tool",
        },
      ],
      parameters: [],
    };

    render(
      <ToolBuilderProvider tool={tool}>
        <HelpMenu />
      </ToolBuilderProvider>,
    );

    const preview = screen.getByText(/USAGE:/).closest("pre");

    expect(preview?.textContent).not.toContain("undefined");
    expect(preview?.textContent).toContain("tool");
  });

  it("does not render COMMANDS section when there are no commands", () => {
    const tool: Tool = {
      binaryName: "tool",
      displayName: "Tool",
      commands: [],
      parameters: [],
    };

    render(
      <ToolBuilderProvider tool={tool}>
        <HelpMenu />
      </ToolBuilderProvider>,
    );

    const preview = screen.getByText(/USAGE:/).closest("pre");
    expect(preview?.textContent).not.toContain("COMMANDS:");
  });
});

describe("generateToolPreview", () => {
  it("includes enum values for option parameters", () => {
    const tool = toolWithOptions([
      {
        key: "format",
        displayName: "Format",
        parameterType: "Option",
        dataType: "Enum",
        aliases: ["--format"],
        enum: {
          values: [
            { value: "json", displayName: "JSON" },
            { value: "csv", displayName: "CSV" },
          ],
        },
      },
    ]);
    const preview = generateToolPreview(tool);
    expect(preview).toContain("json, csv");
  });

  it("includes allowMultiple for enum with multiple selection", () => {
    const tool = toolWithOptions([
      {
        key: "format",
        displayName: "Format",
        parameterType: "Option",
        dataType: "Enum",
        aliases: ["--format"],
        enum: {
          values: [{ value: "json", displayName: "JSON" }],
          allowMultiple: true,
          separator: "|",
        },
      },
    ]);
    const preview = generateToolPreview(tool);
    expect(preview).toContain("Multiple: yes");
    expect(preview).toContain('"|"');
  });

  it("includes validation rules in output", () => {
    const tool = toolWithOptions([
      {
        key: "port",
        displayName: "Port",
        parameterType: "Option",
        dataType: "Number",
        aliases: ["--port"],
        validations: [
          {
            key: "min",
            validationType: "min_value",
            validationValue: "1",
            errorMessage: "Must be at least 1",
          },
          {
            key: "max",
            validationType: "max_value",
            validationValue: "65535",
            errorMessage: "Must be at most 65535",
          },
        ],
      },
    ]);
    const preview = generateToolPreview(tool);
    expect(preview).toContain("min_value=1");
    expect(preview).toContain("max_value=65535");
  });

  it("includes dependencies in output", () => {
    const tool = toolWithOptions([
      {
        key: "output",
        displayName: "Output",
        parameterType: "Option",
        dataType: "String",
        aliases: ["--output"],
        dependencies: [
          {
            key: "d1",
            parameterKey: "output",
            dependsOnParameterKey: "format",
            dependencyType: "requires",
          },
        ],
      },
      {
        key: "format",
        displayName: "Format",
        parameterType: "Option",
        dataType: "String",
        aliases: ["--format"],
      },
    ]);
    const preview = generateToolPreview(tool);
    expect(preview).toContain("Requires: format");
  });

  it("includes conflicts_with dependencies", () => {
    const tool = toolWithOptions([
      {
        key: "verbose",
        displayName: "Verbose",
        parameterType: "Flag",
        dataType: "Boolean",
        aliases: ["--verbose"],
        dependencies: [
          {
            key: "d1",
            parameterKey: "verbose",
            dependsOnParameterKey: "silent",
            dependencyType: "conflicts_with",
          },
        ],
      },
      {
        key: "silent",
        displayName: "Silent",
        parameterType: "Flag",
        dataType: "Boolean",
        aliases: ["--silent"],
      },
    ]);
    const preview = generateToolPreview(tool);
    expect(preview).toContain("Conflicts with: silent");
  });

  it("includes exclusion groups section", () => {
    const tool: Tool = {
      binaryName: "tool",
      displayName: "Tool",
      commands: [],
      parameters: [
        { key: "json", displayName: "JSON", parameterType: "Flag", dataType: "Boolean" },
        { key: "csv", displayName: "CSV", parameterType: "Flag", dataType: "Boolean" },
      ],
      exclusionGroups: [
        {
          displayName: "Output Format",
          exclusionType: "mutual_exclusive",
          parameterKeys: ["json", "csv"],
        },
      ],
    };
    const preview = generateToolPreview(tool);
    expect(preview).toContain("EXCLUSION GROUPS:");
    expect(preview).toContain("Output Format");
    expect(preview).toContain("Mutually exclusive");
    expect(preview).toContain("json, csv");
  });

  it("includes required_one_of exclusion type", () => {
    const tool: Tool = {
      binaryName: "tool",
      displayName: "Tool",
      commands: [],
      parameters: [
        { key: "a", displayName: "A", parameterType: "Flag", dataType: "Boolean" },
        { key: "b", displayName: "B", parameterType: "Flag", dataType: "Boolean" },
      ],
      exclusionGroups: [
        {
          displayName: "Input Source",
          exclusionType: "required_one_of",
          parameterKeys: ["a", "b"],
        },
      ],
    };
    const preview = generateToolPreview(tool);
    expect(preview).toContain("Required one of");
  });

  it("includes enum values for common option parameters", () => {
    const tool: Tool = {
      binaryName: "tool",
      displayName: "Tool",
      commands: [{ key: "run", displayName: "run" }],
      parameters: [
        {
          key: "log-level",
          displayName: "Log Level",
          recursive: true,
          parameterType: "Option",
          dataType: "Enum",
          aliases: ["--log-level"],
          enum: {
            values: [
              { value: "debug", displayName: "Debug" },
              { value: "info", displayName: "Info" },
              { value: "error", displayName: "Error" },
            ],
          },
        },
      ],
    };
    const preview = generateToolPreview(tool);
    expect(preview).toContain("debug, info, error");
  });
});
