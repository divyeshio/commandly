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
});
