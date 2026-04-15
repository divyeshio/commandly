import { SavedCommandsDialog } from "@/components/tool-editor/dialogs/saved-commands-dialog";
import { SavedCommand } from "@/lib/types";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { vi } from "vitest";

const mockCommands: SavedCommand[] = [
  { key: "cmd-one", command: "curl -X GET https://api.example.com" },
  { key: "cmd-two", command: "npm install --save-dev vitest" },
];

describe("SavedCommandsDialog - Rendering", () => {
  it("renders nothing when closed", () => {
    render(
      <SavedCommandsDialog
        open={false}
        onOpenChange={vi.fn()}
        savedCommands={mockCommands}
        onDeleteCommand={vi.fn()}
      />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders the dialog when open", () => {
    render(
      <SavedCommandsDialog
        open={true}
        onOpenChange={vi.fn()}
        savedCommands={mockCommands}
        onDeleteCommand={vi.fn()}
      />,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Saved Commands")).toBeInTheDocument();
  });

  it("shows empty state when there are no saved commands", () => {
    render(
      <SavedCommandsDialog
        open={true}
        onOpenChange={vi.fn()}
        savedCommands={[]}
        onDeleteCommand={vi.fn()}
      />,
    );
    expect(screen.getByText(/no saved commands yet/i)).toBeInTheDocument();
  });

  it("renders all saved commands", () => {
    render(
      <SavedCommandsDialog
        open={true}
        onOpenChange={vi.fn()}
        savedCommands={mockCommands}
        onDeleteCommand={vi.fn()}
      />,
    );
    expect(screen.getByText("curl -X GET https://api.example.com")).toBeInTheDocument();
    expect(screen.getByText("npm install --save-dev vitest")).toBeInTheDocument();
  });
});

describe("SavedCommandsDialog - Interactions", () => {
  it("calls onDeleteCommand with the correct key when delete is clicked", () => {
    const onDeleteCommand = vi.fn();
    render(
      <SavedCommandsDialog
        open={true}
        onOpenChange={vi.fn()}
        savedCommands={mockCommands}
        onDeleteCommand={onDeleteCommand}
      />,
    );
    const commandText = screen.getByText("curl -X GET https://api.example.com");
    const commandRow = commandText.closest("div.space-y-3") as HTMLElement;
    const [, deleteBtn] = within(commandRow).getAllByRole("button");
    fireEvent.click(deleteBtn);
    expect(onDeleteCommand).toHaveBeenCalledWith("cmd-one");
  });

  it("calls onOpenChange(false) when Close is clicked", () => {
    const onOpenChange = vi.fn();
    render(
      <SavedCommandsDialog
        open={true}
        onOpenChange={onOpenChange}
        savedCommands={mockCommands}
        onDeleteCommand={vi.fn()}
      />,
    );
    const [closeButton] = screen.getAllByRole("button", { name: /close/i });
    fireEvent.click(closeButton);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
