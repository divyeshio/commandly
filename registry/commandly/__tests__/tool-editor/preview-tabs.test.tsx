import { PreviewTabs } from "../../tool-editor/preview-tabs";
import { ToolBuilderProvider } from "../../tool-editor/tool-editor.context";
import { defaultTool } from "@/registry/commandly/lib/utils/commandly";
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
