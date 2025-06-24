import { render, screen } from "@testing-library/react";
import { PreviewTabs } from "@/components/tool-editor-ui/preview-tabs";
import { vi } from "vitest";
import {
  OnUrlUpdateFunction,
  withNuqsTestingAdapter
} from "nuqs/adapters/testing";

vi.mock("../tool-editor.store", () => ({
  toolBuilderStore: {
    getState: () => ({
      tool: { name: "tool", displayName: "Tool", commands: [], parameters: [] },
      selectedCommand: null
    }),
    subscribe: vi.fn()
  },
  toolBuilderSelectors: {
    getGlobalParameters: () => [],
    getParametersForCommand: () => []
  }
}));

describe("PreviewTabs", () => {
  it("renders tabs", () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();

    render(<PreviewTabs />, {
      wrapper: withNuqsTestingAdapter({
        searchParams: "?newTool=newTool",
        onUrlUpdate
      })
    });
    expect(screen.getByText(/Json/)).toBeInTheDocument();
    expect(screen.getByText(/Runtime Preview/)).toBeInTheDocument();
    expect(
      screen.getByText(/Help/, { selector: "button" })
    ).toBeInTheDocument();
  });
});
