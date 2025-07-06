import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { HelpMenu } from "../../tool-editor/help-menu";

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
