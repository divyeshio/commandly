import { defaultTool } from "../../../tests/test-utils";
import { ToolRenderer, defaultComponents } from "../tool-renderer";
import { ParameterRendererEntry } from "@/components/commandly/types/renderer";
import { render, screen } from "@testing-library/react";
const baseCommand = { key: "my-tool", displayName: "my-tool", sortOrder: 0 };
// No commands, so the renderer resolves to the tool's own parameters.
const baseTool = { ...defaultTool(), commands: [] as (typeof baseCommand)[] };
const baseParam = {};

describe("ToolRenderer", () => {
  it("renders no parameters message if none", () => {
    render(
      <ToolRenderer
        tool={{ ...baseTool, parameters: [] }}
        catalog={defaultComponents()}
        parameterValues={{}}
        updateParameterValue={() => {}}
      />,
    );
    expect(screen.getByText(/No parameters available/)).toBeInTheDocument();
  });

  it("renders a Flag parameter as a switch", () => {
    const param = {
      ...baseParam,
      key: "verbose",
      displayName: "Verbose",
      parameterType: "Flag" as const,
      dataType: "Boolean" as const,
    };
    render(
      <ToolRenderer
        tool={{ ...baseTool, parameters: [param] }}
        catalog={defaultComponents()}
        parameterValues={{}}
        updateParameterValue={() => {}}
      />,
    );
    expect(screen.getByRole("switch")).toBeInTheDocument();
    expect(screen.getByText("Verbose")).toBeInTheDocument();
  });

  it("renders an Argument parameter as an input", () => {
    const param = {
      ...baseParam,
      key: "target",
      displayName: "Target",
      parameterType: "Argument" as const,
      dataType: "String" as const,
    };
    render(
      <ToolRenderer
        tool={{ ...baseTool, parameters: [param] }}
        catalog={defaultComponents()}
        parameterValues={{}}
        updateParameterValue={() => {}}
      />,
    );
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByText("Target")).toBeInTheDocument();
  });

  it("renders an Option/Enum parameter as a select", () => {
    const param = {
      ...baseParam,
      key: "format",
      displayName: "Format",
      parameterType: "Option" as const,
      dataType: "Enum" as const,
      enum: { values: [{ value: "json", displayName: "JSON" }], allowMultiple: false },
    };
    render(
      <ToolRenderer
        tool={{ ...baseTool, parameters: [param] }}
        catalog={defaultComponents()}
        parameterValues={{}}
        updateParameterValue={() => {}}
      />,
    );
    expect(screen.getByText("Format")).toBeInTheDocument();
    expect(screen.getByText("Select an option")).toBeInTheDocument();
  });

  it("renders an Option/Boolean parameter as a switch", () => {
    const param = {
      ...baseParam,
      key: "enabled",
      displayName: "Enabled",
      parameterType: "Option" as const,
      dataType: "Boolean" as const,
    };
    render(
      <ToolRenderer
        tool={{ ...baseTool, parameters: [param] }}
        catalog={defaultComponents()}
        parameterValues={{}}
        updateParameterValue={() => {}}
      />,
    );
    expect(screen.getByRole("switch")).toBeInTheDocument();
    expect(screen.getByText("Enabled")).toBeInTheDocument();
  });

  it("renders an Option/String parameter as a text input", () => {
    const param = {
      ...baseParam,
      key: "output",
      displayName: "Output",
      parameterType: "Option" as const,
      dataType: "String" as const,
    };
    render(
      <ToolRenderer
        tool={{ ...baseTool, parameters: [param] }}
        catalog={defaultComponents()}
        parameterValues={{}}
        updateParameterValue={() => {}}
      />,
    );
    expect(screen.getByPlaceholderText("Enter value")).toBeInTheDocument();
    expect(screen.getByText("Output")).toBeInTheDocument();
  });

  it("renders a repeatable Option with an 'Add another' button", () => {
    const param = {
      ...baseParam,
      key: "header",
      displayName: "Header",
      parameterType: "Option" as const,
      dataType: "String" as const,
      isRepeatable: true,
    };
    render(
      <ToolRenderer
        tool={{ ...baseTool, parameters: [param] }}
        catalog={defaultComponents()}
        parameterValues={{}}
        updateParameterValue={() => {}}
      />,
    );
    expect(screen.getByText("Header")).toBeInTheDocument();
    expect(screen.getByText("Add another")).toBeInTheDocument();
  });

  it("renders multiple rows for a repeatable Option with array value", () => {
    const param = {
      ...baseParam,
      key: "header",
      displayName: "Header",
      parameterType: "Option" as const,
      dataType: "String" as const,
      isRepeatable: true,
    };
    render(
      <ToolRenderer
        tool={{ ...baseTool, parameters: [param] }}
        catalog={defaultComponents()}
        parameterValues={{
          header: ["Content-Type: application/json", "Authorization: Bearer token"],
        }}
        updateParameterValue={() => {}}
      />,
    );
    const inputs = screen.getAllByPlaceholderText("Enter value");
    expect(inputs).toHaveLength(2);
  });

  it("renders an allowMultiple Enum parameter without crashing when value is an array (repeatable-to-non-repeatable transition)", () => {
    const param = {
      ...baseParam,
      key: "format",
      displayName: "Format",
      parameterType: "Option" as const,
      dataType: "Enum" as const,
      isRepeatable: false,
      enum: {
        values: [
          { value: "json", displayName: "JSON" },
          { value: "xml", displayName: "XML" },
        ],
        allowMultiple: true,
        separator: ",",
      },
    };
    expect(() =>
      render(
        <ToolRenderer
          tool={{ ...baseTool, parameters: [param] }}
          catalog={defaultComponents()}
          parameterValues={{ format: ["json", "xml"] }}
          updateParameterValue={() => {}}
        />,
      ),
    ).not.toThrow();
    expect(screen.getByText("Format")).toBeInTheDocument();
  });

  it("custom catalog entry takes precedence over built-in", () => {
    const param = {
      ...baseParam,
      key: "verbose",
      displayName: "Verbose",
      parameterType: "Flag" as const,
      dataType: "Boolean" as const,
    };
    const customEntry: ParameterRendererEntry = {
      condition: (p) => p.parameterType === "Flag",
      component: () => <div data-testid="custom-flag">custom</div>,
    };
    render(
      <ToolRenderer
        tool={{ ...baseTool, parameters: [param] }}
        catalog={[customEntry, ...defaultComponents()]}
        parameterValues={{}}
        updateParameterValue={() => {}}
      />,
    );
    expect(screen.getByTestId("custom-flag")).toBeInTheDocument();
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });

  it("renders root parameters for a tool with no commands", () => {
    const rootTool = {
      binaryName: "httpx",
      displayName: "Httpx",
      commands: [],
      parameters: [
        {
          key: "list",
          displayName: "List",
          parameterType: "Option" as const,
          dataType: "String" as const,
          aliases: ["-list"],
        },
        {
          key: "verbose",
          displayName: "Verbose",
          parameterType: "Flag" as const,
          dataType: "Boolean" as const,
          aliases: ["--verbose"],
        },
      ],
    };
    render(
      <ToolRenderer
        tool={rootTool}
        catalog={defaultComponents()}
        parameterValues={{}}
        updateParameterValue={() => {}}
      />,
    );
    expect(screen.getByText("List")).toBeInTheDocument();
    expect(screen.getByText("Verbose")).toBeInTheDocument();
  });

  it("shows no parameters message for root-only tool with empty parameters", () => {
    const emptyRootTool = {
      binaryName: "httpx",
      displayName: "Httpx",
      commands: [],
      parameters: [],
    };
    render(
      <ToolRenderer
        tool={emptyRootTool}
        catalog={defaultComponents()}
        parameterValues={{}}
        updateParameterValue={() => {}}
      />,
    );
    expect(screen.getByText(/No parameters available/)).toBeInTheDocument();
  });

  it("renders root parameters when tool has commands but selectedCommand is null", () => {
    const tool = {
      binaryName: "mycli",
      displayName: "My CLI",
      commands: [
        {
          key: "sub",
          displayName: "sub",
          sortOrder: 0,
          parameters: [
            {
              key: "output",
              displayName: "Output",
              parameterType: "Option" as const,
              dataType: "String" as const,
              aliases: ["--output"],
            },
          ],
        },
      ],
      parameters: [
        {
          key: "verbose",
          displayName: "Verbose",
          parameterType: "Flag" as const,
          dataType: "Boolean" as const,
          aliases: ["--verbose"],
        },
      ],
    };
    render(
      <ToolRenderer
        tool={tool}
        selectedCommand={null}
        catalog={defaultComponents()}
        parameterValues={{}}
        updateParameterValue={() => {}}
      />,
    );
    expect(screen.getByText("Verbose")).toBeInTheDocument();
    expect(screen.queryByText("Output")).not.toBeInTheDocument();
  });

  it("renders recursive root parameters when root is selected (selectedCommand is null)", () => {
    const tool = {
      binaryName: "mycli",
      displayName: "My CLI",
      commands: [
        {
          key: "sub",
          displayName: "sub",
          sortOrder: 0,
          parameters: [
            {
              key: "output",
              displayName: "Output",
              parameterType: "Option" as const,
              dataType: "String" as const,
              aliases: ["--output"],
            },
          ],
        },
      ],
      parameters: [
        {
          key: "common-flag",
          displayName: "CommonFlag",
          parameterType: "Flag" as const,
          dataType: "Boolean" as const,
          aliases: ["--common"],
          recursive: true,
        },
      ],
    };
    render(
      <ToolRenderer
        tool={tool}
        selectedCommand={null}
        catalog={defaultComponents()}
        parameterValues={{}}
        updateParameterValue={() => {}}
      />,
    );
    expect(screen.getByText("CommonFlag")).toBeInTheDocument();
    expect(screen.queryByText("Output")).not.toBeInTheDocument();
  });

  it("renders a recursive ancestor parameter for a nested subcommand", () => {
    const tool = {
      binaryName: "mycli",
      displayName: "My CLI",
      commands: [
        {
          key: "config",
          displayName: "config",
          sortOrder: 0,
          parameters: [
            {
              key: "inherited",
              displayName: "Inherited",
              parameterType: "Flag" as const,
              dataType: "Boolean" as const,
              aliases: ["--inherited"],
              recursive: true,
            },
            {
              key: "scoped",
              displayName: "Scoped",
              parameterType: "Flag" as const,
              dataType: "Boolean" as const,
              aliases: ["--scoped"],
            },
          ],
          commands: [{ key: "get", displayName: "get", sortOrder: 0 }],
        },
      ],
      parameters: [],
    };
    render(
      <ToolRenderer
        tool={tool}
        selectedCommand={tool.commands[0].commands![0]}
        catalog={defaultComponents()}
        parameterValues={{}}
        updateParameterValue={() => {}}
      />,
    );
    expect(screen.getByText("Inherited")).toBeInTheDocument();
    expect(screen.queryByText("Scoped")).not.toBeInTheDocument();
  });

  it("does not render info icon when description is empty or absent", () => {
    const paramNoDesc = {
      ...baseParam,
      key: "flag-no-desc",
      displayName: "NoDesc",
      parameterType: "Flag" as const,
      dataType: "Boolean" as const,
      description: undefined,
    };
    const paramEmptyDesc = {
      ...baseParam,
      key: "flag-empty-desc",
      displayName: "EmptyDesc",
      parameterType: "Flag" as const,
      dataType: "Boolean" as const,
      description: "",
    };
    render(
      <ToolRenderer
        tool={{ ...baseTool, parameters: [paramNoDesc, paramEmptyDesc] }}
        catalog={defaultComponents()}
        parameterValues={{}}
        updateParameterValue={() => {}}
      />,
    );
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  describe("exclusion groups", () => {
    const groupedTool = (exclusionType: "mutual_exclusive" | "required_one_of") => ({
      ...baseTool,
      parameters: [
        {
          ...baseParam,
          key: "cdn",
          displayName: "CDN",
          parameterType: "Flag" as const,
          dataType: "Boolean" as const,
        },
        {
          ...baseParam,
          key: "cloud",
          displayName: "Cloud",
          parameterType: "Flag" as const,
          dataType: "Boolean" as const,
        },
      ],
      exclusionGroups: [
        {
          key: "detection",
          displayName: "Detection",
          exclusionType,
          parameterKeys: ["cdn", "cloud"],
        },
      ],
    });

    it("disables the other members once one of them is provided", () => {
      render(
        <ToolRenderer
          tool={groupedTool("mutual_exclusive")}
          catalog={defaultComponents()}
          parameterValues={{ cdn: true }}
          updateParameterValue={() => {}}
        />,
      );

      const switches = screen.getAllByRole("switch");
      expect(switches[0]).not.toBeDisabled();
      expect(switches[1]).toBeDisabled();
      expect(screen.getByText("excluded by Detection")).toBeInTheDocument();
    });

    it("leaves every member enabled while none of them is provided", () => {
      render(
        <ToolRenderer
          tool={groupedTool("mutual_exclusive")}
          catalog={defaultComponents()}
          parameterValues={{}}
          updateParameterValue={() => {}}
        />,
      );

      for (const control of screen.getAllByRole("switch")) {
        expect(control).not.toBeDisabled();
      }
    });

    it("marks a required-one-of group as required until one of them is provided", () => {
      const { rerender } = render(
        <ToolRenderer
          tool={groupedTool("required_one_of")}
          catalog={defaultComponents()}
          parameterValues={{}}
          updateParameterValue={() => {}}
        />,
      );
      expect(screen.getAllByText("*")).toHaveLength(2);

      rerender(
        <ToolRenderer
          tool={groupedTool("required_one_of")}
          catalog={defaultComponents()}
          parameterValues={{ cdn: true }}
          updateParameterValue={() => {}}
        />,
      );
      expect(screen.queryAllByText("*")).toHaveLength(0);
    });
  });
});
