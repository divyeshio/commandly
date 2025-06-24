import { render, screen } from "@testing-library/react";
import { HelpMenu } from "@/components/tool-editor-ui/help-menu";
import { vi } from "vitest";

vi.mock("../tool-editor.store", () => ({
  toolBuilderStore: {
    getState: () => ({
      tool: { name: "tool", displayName: "Tool", commands: [], parameters: [] }
    }),
    subscribe: vi.fn()
  }
}));

describe("HelpMenu", () => {
  it("renders tool name and description", () => {
    render(<HelpMenu />);
    expect(screen.getByText(/Tool/)).toBeInTheDocument();
  });
});
