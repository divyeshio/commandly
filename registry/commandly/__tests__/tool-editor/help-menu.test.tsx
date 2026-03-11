import { HelpMenu } from "../../tool-editor/help-menu";
import { ToolBuilderProvider } from "../../tool-editor/tool-editor.context";
import { defaultTool } from "@/registry/commandly/lib/utils/commandly";
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
});
