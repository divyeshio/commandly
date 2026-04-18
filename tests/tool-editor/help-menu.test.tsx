import { defaultTool } from "../test-utils";
import type { Tool } from "@/components/commandly/types/flat";
import { generateToolPreview, HelpMenu } from "@/components/tool-editor/help-menu";
import { ToolBuilderProvider } from "@/components/tool-editor/tool-editor.context";
import { render, screen } from "@testing-library/react";

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
          name: "tool",
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
    const tool: Tool = {
      binaryName: "tool",
      displayName: "Tool",
      commands: [{ key: "run", name: "run" }],
      parameters: [
        {
          key: "format",
          name: "Format",
          commandKey: "run",
          parameterType: "Option",
          dataType: "Enum",
          longFlag: "--format",
          enum: {
            values: [
              { value: "json", displayName: "JSON" },
              { value: "csv", displayName: "CSV" },
            ],
          },
        },
      ],
    };
    const preview = generateToolPreview(tool);
    expect(preview).toContain("json, csv");
  });

  it("includes allowMultiple for enum with multiple selection", () => {
    const tool: Tool = {
      binaryName: "tool",
      displayName: "Tool",
      commands: [{ key: "run", name: "run" }],
      parameters: [
        {
          key: "format",
          name: "Format",
          commandKey: "run",
          parameterType: "Option",
          dataType: "Enum",
          longFlag: "--format",
          enum: {
            values: [{ value: "json", displayName: "JSON" }],
            allowMultiple: true,
            separator: "|",
          },
        },
      ],
    };
    const preview = generateToolPreview(tool);
    expect(preview).toContain("Multiple: yes");
    expect(preview).toContain('"|"');
  });

  it("includes validation rules in output", () => {
    const tool: Tool = {
      binaryName: "tool",
      displayName: "Tool",
      commands: [{ key: "run", name: "run" }],
      parameters: [
        {
          key: "port",
          name: "Port",
          commandKey: "run",
          parameterType: "Option",
          dataType: "Number",
          longFlag: "--port",
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
      ],
    };
    const preview = generateToolPreview(tool);
    expect(preview).toContain("min_value=1");
    expect(preview).toContain("max_value=65535");
  });

  it("includes dependencies in output", () => {
    const tool: Tool = {
      binaryName: "tool",
      displayName: "Tool",
      commands: [{ key: "run", name: "run" }],
      parameters: [
        {
          key: "output",
          name: "Output",
          commandKey: "run",
          parameterType: "Option",
          dataType: "String",
          longFlag: "--output",
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
          name: "Format",
          commandKey: "run",
          parameterType: "Option",
          dataType: "String",
          longFlag: "--format",
        },
      ],
    };
    const preview = generateToolPreview(tool);
    expect(preview).toContain("Requires: format");
  });

  it("includes conflicts_with dependencies", () => {
    const tool: Tool = {
      binaryName: "tool",
      displayName: "Tool",
      commands: [{ key: "run", name: "run" }],
      parameters: [
        {
          key: "verbose",
          name: "Verbose",
          commandKey: "run",
          parameterType: "Flag",
          dataType: "Boolean",
          longFlag: "--verbose",
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
          name: "Silent",
          commandKey: "run",
          parameterType: "Flag",
          dataType: "Boolean",
          longFlag: "--silent",
        },
      ],
    };
    const preview = generateToolPreview(tool);
    expect(preview).toContain("Conflicts with: silent");
  });

  it("includes exclusion groups section", () => {
    const tool: Tool = {
      binaryName: "tool",
      displayName: "Tool",
      commands: [],
      parameters: [
        { key: "json", name: "JSON", parameterType: "Flag", dataType: "Boolean" },
        { key: "csv", name: "CSV", parameterType: "Flag", dataType: "Boolean" },
      ],
      exclusionGroups: [
        {
          name: "Output Format",
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
        { key: "a", name: "A", parameterType: "Flag", dataType: "Boolean" },
        { key: "b", name: "B", parameterType: "Flag", dataType: "Boolean" },
      ],
      exclusionGroups: [
        {
          name: "Input Source",
          exclusionType: "required_one_of",
          parameterKeys: ["a", "b"],
        },
      ],
    };
    const preview = generateToolPreview(tool);
    expect(preview).toContain("Required one of");
  });

  it("includes enum values for global option parameters", () => {
    const tool: Tool = {
      binaryName: "tool",
      displayName: "Tool",
      commands: [{ key: "run", name: "run" }],
      parameters: [
        {
          key: "log-level",
          name: "Log Level",
          isGlobal: true,
          parameterType: "Option",
          dataType: "Enum",
          longFlag: "--log-level",
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
