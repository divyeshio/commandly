import { render, screen } from "@testing-library/react";
import ToolEditor from "../../../src/tools/components/tool-editor-ui/tool-editor";
import { vi } from "vitest";
import { defaultTool } from "../../../src/tools/lib/utils/tool-editor";
import {
  withNuqsTestingAdapter,
  type OnUrlUpdateFunction
} from "nuqs/adapters/testing";

vi.mock("../tool-editor.store", () => ({
  toolBuilderStore: {
    getState: () => ({
      tool: { name: "tool", displayName: "Tool", commands: [], parameters: [] },
      selectedCommand: null,
      selectedParameter: null
    }),
    subscribe: vi.fn()
  },
  toolBuilderActions: {
    initializeTool: vi.fn(),
    setEditToolDialogOpen: vi.fn(),
    setSavedCommandsDialogOpen: vi.fn(),
    setExclusionGroupsDialogOpen: vi.fn()
  },
  toolBuilderSelectors: {
    getGlobalParameters: () => [],
    getParametersForCommand: () => []
  }
}));

describe("ToolEditor", () => {
  it("renders tool name and displayName", () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();

    render(<ToolEditor tool={defaultTool("newTool", "New Tool")} />, {
      wrapper: withNuqsTestingAdapter({
        searchParams: "?newTool=newTool",
        onUrlUpdate
      })
    });
    expect(
      screen.getByText(/New Tool/, { selector: "span" })
    ).toBeInTheDocument();
  });
});
