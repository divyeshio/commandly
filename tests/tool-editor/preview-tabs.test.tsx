import { PreviewTabs } from "@/components/tool-editor/preview-tabs";
import { ToolBuilderProvider } from "@/components/tool-editor/tool-editor.context";
import { defaultTool } from "@/lib/utils";
import { render, screen } from "@testing-library/react";

describe("PreviewTabs", () => {
  it("renders tabs", () => {
    render(
      <ToolBuilderProvider tool={defaultTool("tool", "Tool")}>
        <PreviewTabs />
      </ToolBuilderProvider>,
    );
    expect(screen.getByText(/Json/)).toBeInTheDocument();
    expect(screen.getByText(/Runtime Preview/)).toBeInTheDocument();
    expect(screen.getByText(/Help/, { selector: "button" })).toBeInTheDocument();
  });
});
