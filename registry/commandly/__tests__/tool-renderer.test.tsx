import { defaultTool } from "../../../tests/test-utils";
import { ToolRenderer, defaultComponents } from "../tool-renderer";
import { ParameterRendererEntry } from "@/components/commandly/types/renderer";
import { render, screen } from "@testing-library/react";
const baseCommand = { key: "my-tool", name: "my-tool", sortOrder: 0 };
const baseTool = { ...defaultTool(), commands: [baseCommand] };
const baseParam = { commandKey: "my-tool" };

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
      name: "Verbose",
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
      name: "Target",
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
      name: "Format",
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
      name: "Enabled",
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
      name: "Output",
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
      name: "Header",
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
      name: "Header",
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
      name: "Format",
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
      name: "Verbose",
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
          name: "List",
          parameterType: "Option" as const,
          dataType: "String" as const,
          longFlag: "-list",
        },
        {
          key: "verbose",
          name: "Verbose",
          parameterType: "Flag" as const,
          dataType: "Boolean" as const,
          longFlag: "--verbose",
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
      commands: [{ key: "sub", name: "sub", sortOrder: 0 }],
      parameters: [
        {
          key: "verbose",
          name: "Verbose",
          parameterType: "Flag" as const,
          dataType: "Boolean" as const,
          longFlag: "--verbose",
        },
        {
          key: "output",
          name: "Output",
          parameterType: "Option" as const,
          dataType: "String" as const,
          longFlag: "--output",
          commandKey: "sub",
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

  it("renders global parameters when root is selected (selectedCommand is null)", () => {
    const tool = {
      binaryName: "mycli",
      displayName: "My CLI",
      commands: [{ key: "sub", name: "sub", sortOrder: 0 }],
      parameters: [
        {
          key: "global-flag",
          name: "GlobalFlag",
          parameterType: "Flag" as const,
          dataType: "Boolean" as const,
          longFlag: "--global",
          isGlobal: true,
        },
        {
          key: "output",
          name: "Output",
          parameterType: "Option" as const,
          dataType: "String" as const,
          longFlag: "--output",
          commandKey: "sub",
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
    expect(screen.getByText("GlobalFlag")).toBeInTheDocument();
    expect(screen.queryByText("Output")).not.toBeInTheDocument();
  });

  it("does not render info icon when description is empty or absent", () => {
    const paramNoDesc = {
      ...baseParam,
      key: "flag-no-desc",
      name: "NoDesc",
      parameterType: "Flag" as const,
      dataType: "Boolean" as const,
      description: undefined,
    };
    const paramEmptyDesc = {
      ...baseParam,
      key: "flag-empty-desc",
      name: "EmptyDesc",
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
});
