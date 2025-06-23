import { render, screen } from "@testing-library/react";
import { CommandTree } from "@/components/tool-editor-ui/command-tree";
import { vi } from "vitest";

vi.mock("../tool-editor.store", () => ({
  toolBuilderStore: {
    getState: () => ({
      tool: { name: "tool", commands: [], parameters: [] },
      selectedCommand: null,
      editingCommand: null,
    }),
    subscribe: vi.fn(),
  },
  toolBuilderActions: {
    setSelectedCommand: vi.fn(),
    setEditingCommand: vi.fn(),
    addSubcommand: vi.fn(),
    deleteCommand: vi.fn(),
  },
}));

describe("CommandTree", () => {
  it("renders add command button", () => {
    render(<CommandTree />);
    expect(screen.getByText(/Add Command/)).toBeInTheDocument();
  });
});
