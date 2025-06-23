import { render, screen, fireEvent } from "@testing-library/react";
import { ParameterList } from "@/components/tool-editor-ui/parameter-list";
import { vi } from "vitest";

vi.mock("../tool-editor.store", () => ({
  toolBuilderStore: {
    getState: () => ({
      selectedCommand: { name: "test", id: "cmd1" },
      selectedParameter: null,
      tool: { name: "tool", commands: [], parameters: [] },
    }),
    subscribe: vi.fn(),
  },
  toolBuilderActions: {
    setSelectedParameter: vi.fn(),
    removeParameter: vi.fn(),
  },
  toolBuilderSelectors: {
    getGlobalParameters: () => [],
    getParametersForCommand: () => [],
    getExclusionGroupsForCommand: () => [],
  },
}));

describe("ParameterList", () => {
  it("renders with title", () => {
    render(<ParameterList title="Test Params" />);
    expect(screen.getByText(/Test Params/)).toBeInTheDocument();
  });

  it("renders global icon if isGlobal", () => {
    render(<ParameterList title="Global Params" isGlobal />);
    expect(
      screen.getByRole("heading", { name: "Global Params (1)" })
    ).toBeInTheDocument();
  });

  it("calls setSelectedParameter on add", () => {
    render(<ParameterList title="Params" />);
    fireEvent.click(screen.getByRole("button"));
  });
});
