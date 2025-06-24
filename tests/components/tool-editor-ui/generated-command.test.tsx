import { render, screen } from "@testing-library/react";
import { GeneratedCommand } from "@/components/tool-editor-ui/generated-command";
import { vi } from "vitest";

vi.mock("../tool-editor.store", () => ({
  toolBuilderStore: {
    getState: () => ({
      selectedCommand: {
        name: "test",
        id: "01979f70-cc01-73fe-b638-11efe685b4df"
      },
      tool: { name: "tool", commands: [], parameters: [] },
      parameterValues: {}
    }),
    subscribe: vi.fn()
  },
  toolBuilderActions: {
    addSavedCommand: vi.fn()
  },
  toolBuilderSelectors: {
    getGlobalParameters: () => [],
    getParametersForCommand: () => []
  }
}));

describe("GeneratedCommand", () => {
  it("renders configure parameters message if no generated command", () => {
    render(<GeneratedCommand />);
    expect(screen.getByText(/Configure parameters/)).toBeInTheDocument();
  });
});
