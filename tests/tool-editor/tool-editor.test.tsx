import ToolEditor from "@/components/tool-editor/tool-editor";
import type { Tool } from "@/components/commandly/types/flat";
import { defaultTool } from "@/lib/utils";
import { fireEvent, render, screen, within } from "@testing-library/react";
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

  it("disables save and shows validation when no commands", async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>();
    const onSave = vi.fn();

    const toolWithoutCommands: Tool = {
      name: "empty",
      displayName: "Empty",
      commands: [],
      parameters: [],
    };

    render(
      <ToolEditor tool={toolWithoutCommands} onSave={onSave} />,
      {
        wrapper: withNuqsTestingAdapter({
          searchParams: "?newTool=newTool",
          onUrlUpdate,
        }),
      },
    );

    const header = screen.getByText(/empty/i, { selector: "span" });
    expect(header).toBeInTheDocument();

    const editButton = screen.getByRole("button", { name: /edit tool/i });
    fireEvent.click(editButton);

    const dialog = await screen.findByRole("dialog");
    const displayNameInput = within(dialog).getByLabelText(/display name/i);
    fireEvent.change(displayNameInput, { target: { value: "Empty Tool" } });

    const closeButtons = within(dialog).getAllByRole("button", { name: /close/i });
    fireEvent.click(closeButtons[0]);

    const saveButton = await screen.findByRole("button", { name: /^save$/i });
    expect(saveButton).toBeDisabled();
    expect(
      screen.getByText(/at least one command are required/i),
    ).toBeInTheDocument();
  });
});
