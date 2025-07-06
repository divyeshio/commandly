import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { defaultTool } from "@/registry/commandly/lib/utils/commandly";
import {
  withNuqsTestingAdapter,
  type OnUrlUpdateFunction
} from "nuqs/adapters/testing";
import ToolEditor from "../../tool-editor/tool-editor";

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
    setExclusionGroupsDialogOpen: vi.fn()
  },
  toolBuilderSelectors: {
    getGlobalParameters: () => [],
    getParametersForCommand: () => []
  }
}));

vi.mock("@/lib/utils/tool-editor", async () => {
  const original = await vi.importActual("@/lib/utils/tool-editor");
  return {
    ...original,
    getSavedCommandsFromStorage: vi.fn(() => []),
    removeSavedCommandFromStorage: vi.fn()
  };
});

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
