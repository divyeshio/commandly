import ToolEditor from "@/components/tool-editor/tool-editor";
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
});
