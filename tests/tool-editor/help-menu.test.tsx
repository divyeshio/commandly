import type { Tool } from "@/components/commandly/types/flat";
import { HelpMenu } from "@/components/tool-editor/help-menu";
import { ToolBuilderProvider } from "@/components/tool-editor/tool-editor.context";
import { defaultTool } from "@/lib/utils";
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
