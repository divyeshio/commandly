import { ToolRenderer, defaultComponents } from "../tool-renderer";
import { defaultTool } from "@/lib/utils";
import { ParameterRendererEntry } from "@/registry/commandly/lib/types/renderer";
import { createNewParameter } from "@/registry/commandly/lib/utils/commandly";
import { render, screen } from "@testing-library/react";

const baseCommand = { key: "my-tool", name: "my-tool", isDefault: true, sortOrder: 0 };
const baseTool = { ...defaultTool(), commands: [baseCommand] };

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
      ...createNewParameter(false, "my-tool"),
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
      ...createNewParameter(false, "my-tool"),
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
      ...createNewParameter(false, "my-tool"),
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
      ...createNewParameter(false, "my-tool"),
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
      ...createNewParameter(false, "my-tool"),
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

  it("custom catalog entry takes precedence over built-in", () => {
    const param = {
      ...createNewParameter(false, "my-tool"),
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
});
