import { Tool } from "@/components/commandly/types/flat";
import { ToolDetailsDialog } from "@/components/tool-editor/dialogs/tool-details-dialog";
import ToolEditor from "@/components/tool-editor/tool-editor";
import {
  ToolBuilderProvider,
  ToolBuilderState,
  useToolBuilder,
} from "@/components/tool-editor/tool-editor.context";
import { defaultTool } from "@/lib/utils";
import { useBlocker } from "@tanstack/react-router";
import { fireEvent, render, screen } from "@testing-library/react";
import { withNuqsTestingAdapter, type OnUrlUpdateFunction } from "nuqs/adapters/testing";
import { ReactNode } from "react";
import { vi } from "vitest";

const { useBlockerMock } = vi.hoisted(() => ({
  useBlockerMock: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  useBlocker: useBlockerMock,
}));

let capturedCtx: ReturnType<typeof useToolBuilder>;

function ContextCapture() {
  capturedCtx = useToolBuilder();
  return null;
}

function renderWithProvider(ui: ReactNode, initialState: Partial<ToolBuilderState>) {
  return render(
    <ToolBuilderProvider
      tool={initialState.tool ?? defaultTool("test-tool", "Test Tool")}
      initialState={initialState}
    >
      {ui}
      <ContextCapture />
    </ToolBuilderProvider>,
  );
}

describe("ToolEditor", () => {
  beforeEach(() => {
    vi.mocked(useBlocker).mockReset();
  });

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
    const incompleteTool = {
      ...defaultTool(),
      binaryName: undefined,
      displayName: undefined,
    } as unknown as Tool;

    expect(() =>
      render(<ToolEditor tool={incompleteTool} />, {
        wrapper: withNuqsTestingAdapter({
          searchParams: "?test=test",
          onUrlUpdate,
        }),
      }),
    ).not.toThrow();
  });

  it("updates root interactive from tool settings dialog", () => {
    renderWithProvider(<ToolDetailsDialog />, {
      tool: defaultTool("test-tool", "Test Tool"),
      dialogs: {
        parameterDetails: false,
        editTool: true,
        savedCommands: false,
        exclusionGroups: false,
      },
    });

    const interactiveSwitch = screen.getByLabelText("Interactive");

    expect(capturedCtx.tool.interactive).toBeUndefined();
    fireEvent.click(interactiveSwitch);
    expect(capturedCtx.tool.interactive).toBe(true);
  });

  it("enables navigation blocking when the editor becomes dirty", () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();

    render(<ToolEditor tool={defaultTool("test-tool", "Test Tool")} />, {
      wrapper: withNuqsTestingAdapter({
        searchParams: "?test-tool=test-tool",
        onUrlUpdate,
      }),
    });

    expect(useBlocker).toHaveBeenLastCalledWith(
      expect.objectContaining({ enableBeforeUnload: false }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Edit tool" }));
    fireEvent.click(screen.getByLabelText("Interactive"));

    expect(useBlocker).toHaveBeenLastCalledWith(
      expect.objectContaining({ enableBeforeUnload: true }),
    );
  });
});
