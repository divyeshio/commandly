import ToolEditor from "@/components/tool-editor/tool-editor";
import { Tool } from "@/components/commandly/types/flat";
import { defaultTool } from "@/lib/utils";
import { render, screen } from "@testing-library/react";
import { withNuqsTestingAdapter, type OnUrlUpdateFunction } from "nuqs/adapters/testing";
import { vi } from "vitest";

describe("ToolEditor", () => {
  it("renders tool name and displayName", () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();

    render(<ToolEditor tool={defaultTool("newTool", "New Tool")} />, {
      wrapper: withNuqsTestingAdapter({
        searchParams: "?newTool=newTool",
        onUrlUpdate,
      }),
    });
    expect(screen.getByText(/New Tool/, { selector: "span" })).toBeInTheDocument();
  });

  it("does not crash when binaryName or displayName is undefined", () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
    const incompleteTool = { ...defaultTool(), binaryName: undefined, displayName: undefined } as unknown as Tool;

    expect(() =>
      render(<ToolEditor tool={incompleteTool} />, {
        wrapper: withNuqsTestingAdapter({
          searchParams: "?test=test",
          onUrlUpdate,
        }),
      })
    ).not.toThrow();
  });
});
