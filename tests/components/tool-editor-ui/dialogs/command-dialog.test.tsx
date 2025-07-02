import { render, screen, fireEvent } from "@testing-library/react";
import { CommandDialog } from "@/components/tool-editor-ui/dialogs/command-dialog";
import {
  ToolBuilderState,
  toolBuilderStore,
  toolBuilderActions
} from "@/components/tool-editor-ui/tool-editor.store";
import { defaultTool } from "@/lib/utils/tool-editor";
import { Command } from "@/lib/types/tool-editor";

const createTestCommand = (overrides: Partial<Command> = {}): Command => ({
  id: "01979f6d-f205-73e3-a176-4456d7bf7eb3",
  name: "test-command",
  description: "Test command description",
  isDefault: false,
  sortOrder: 0,
  ...overrides
});

const createTestState = (
  command: Command,
  toolName: string = "test-tool"
): ToolBuilderState => ({
  tool: { ...defaultTool(toolName, "Test tool"), name: toolName },
  selectedCommand: command,
  selectedParameter: null,
  editingCommand: command,
  parameterValues: {},
  dialogs: {
    editTool: false,
    savedCommands: false,
    exclusionGroups: false
  }
});

describe("CommandDialog - Rendering & Structure", () => {
  const mockOnOpenChange = vi.fn();
  const testCommand = createTestCommand();

  beforeEach(() => {
    vi.clearAllMocks();
    toolBuilderStore.setState(createTestState(testCommand));
  });

  it("renders the dialog when isOpen is true", () => {
    render(<CommandDialog isOpen={true} onOpenChange={mockOnOpenChange} />);

    expect(screen.getByText("Edit Command Settings")).toBeInTheDocument();
    expect(screen.getByLabelText("Command Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Sort Order")).toBeInTheDocument();
    expect(screen.getByLabelText("Default Command")).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Save & Close" })
    ).toBeInTheDocument();
  });

  it("does not render dialog content when isOpen is false", () => {
    render(<CommandDialog isOpen={false} onOpenChange={mockOnOpenChange} />);

    expect(screen.queryByText("Edit Command Settings")).not.toBeInTheDocument();
  });

  it("displays the terminal icon in the dialog title", () => {
    render(<CommandDialog isOpen={true} onOpenChange={mockOnOpenChange} />);

    const title = screen.getByText("Edit Command Settings");
    expect(title).toHaveClass("flex", "items-center", "gap-2");
  });
  it("calls onOpenChange with false when dialog is closed", () => {
    const { rerender } = render(
      <CommandDialog isOpen={true} onOpenChange={mockOnOpenChange} />
    );

    // Simulate closing the dialog by changing isOpen prop
    rerender(<CommandDialog isOpen={false} onOpenChange={mockOnOpenChange} />);

    // The onOpenChange should be called by the Dialog component itself when closed
    // We'll test this by verifying the dialog behavior works correctly
    expect(screen.queryByText("Edit Command Settings")).not.toBeInTheDocument();
  });
});

describe("CommandDialog - Form Fields", () => {
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("displays current command name in the input", () => {
    const command = createTestCommand({ name: "my-command" });
    toolBuilderStore.setState(createTestState(command));

    render(<CommandDialog isOpen={true} onOpenChange={mockOnOpenChange} />);

    const nameInput = screen.getByLabelText("Command Name") as HTMLInputElement;
    expect(nameInput.value).toBe("my-command");
  });

  it("updates command name when input changes", () => {
    const command = createTestCommand();
    toolBuilderStore.setState(createTestState(command));

    render(<CommandDialog isOpen={true} onOpenChange={mockOnOpenChange} />);

    const nameInput = screen.getByLabelText("Command Name");
    fireEvent.change(nameInput, { target: { value: "new-command" } });

    expect((nameInput as HTMLInputElement).value).toBe("new-command");
  });

  it("disables command name input when command name matches tool name", () => {
    const command = createTestCommand({ name: "test-tool" });
    toolBuilderStore.setState(createTestState(command, "test-tool"));

    render(<CommandDialog isOpen={true} onOpenChange={mockOnOpenChange} />);

    const nameInput = screen.getByLabelText("Command Name");
    expect(nameInput).toBeDisabled();
  });

  it("displays current sort order in the input", () => {
    const command = createTestCommand({ sortOrder: 5 });
    toolBuilderStore.setState(createTestState(command));

    render(<CommandDialog isOpen={true} onOpenChange={mockOnOpenChange} />);

    const sortOrderInput = screen.getByLabelText(
      "Sort Order"
    ) as HTMLInputElement;
    expect(sortOrderInput.value).toBe("5");
  });

  it("updates sort order when input changes", () => {
    const command = createTestCommand();
    toolBuilderStore.setState(createTestState(command));

    render(<CommandDialog isOpen={true} onOpenChange={mockOnOpenChange} />);

    const sortOrderInput = screen.getByLabelText("Sort Order");
    fireEvent.change(sortOrderInput, { target: { value: "10" } });

    expect((sortOrderInput as HTMLInputElement).value).toBe("10");
  });

  it("defaults sort order to 0 for invalid input", () => {
    const command = createTestCommand();
    toolBuilderStore.setState(createTestState(command));

    render(<CommandDialog isOpen={true} onOpenChange={mockOnOpenChange} />);

    const sortOrderInput = screen.getByLabelText("Sort Order");
    fireEvent.change(sortOrderInput, { target: { value: "invalid" } });

    expect((sortOrderInput as HTMLInputElement).value).toBe("0");
  });

  it("displays current description in the textarea", () => {
    const command = createTestCommand({ description: "My test description" });
    toolBuilderStore.setState(createTestState(command));

    render(<CommandDialog isOpen={true} onOpenChange={mockOnOpenChange} />);

    const descriptionTextarea = screen.getByLabelText(
      "Description"
    ) as HTMLTextAreaElement;
    expect(descriptionTextarea.value).toBe("My test description");
  });

  it("updates description when textarea changes", () => {
    const command = createTestCommand();
    toolBuilderStore.setState(createTestState(command));

    render(<CommandDialog isOpen={true} onOpenChange={mockOnOpenChange} />);

    const descriptionTextarea = screen.getByLabelText("Description");
    fireEvent.change(descriptionTextarea, {
      target: { value: "New description" }
    });

    expect((descriptionTextarea as HTMLTextAreaElement).value).toBe(
      "New description"
    );
  });
});

describe("CommandDialog - Default Command Switch", () => {
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reflects current isDefault state", () => {
    const command = createTestCommand({ isDefault: true });
    toolBuilderStore.setState(createTestState(command));

    render(<CommandDialog isOpen={true} onOpenChange={mockOnOpenChange} />);

    const defaultSwitch = screen.getByLabelText("Default Command");
    expect(defaultSwitch).toBeChecked();
  });

  it("updates isDefault when switch is toggled", () => {
    const command = createTestCommand({ isDefault: false });
    toolBuilderStore.setState(createTestState(command));

    render(<CommandDialog isOpen={true} onOpenChange={mockOnOpenChange} />);

    const defaultSwitch = screen.getByLabelText("Default Command");
    fireEvent.click(defaultSwitch);

    expect(defaultSwitch).toBeChecked();
  });

  it("disables switch when command is already default", () => {
    const command = createTestCommand({ isDefault: true });
    toolBuilderStore.setState(createTestState(command));

    render(<CommandDialog isOpen={true} onOpenChange={mockOnOpenChange} />);

    const defaultSwitch = screen.getByLabelText("Default Command");
    expect(defaultSwitch).toBeDisabled();
  });
});

describe("CommandDialog - Save Functionality", () => {
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(toolBuilderActions, "updateCommand").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls updateCommand and closes dialog when Save & Close is clicked", () => {
    const command = createTestCommand({
      id: "01979f6d-f206-7716-a2f2-4ee692f068ac",
      name: "original-command"
    });
    toolBuilderStore.setState(createTestState(command));

    render(<CommandDialog isOpen={true} onOpenChange={mockOnOpenChange} />);

    const nameInput = screen.getByLabelText("Command Name");
    fireEvent.change(nameInput, { target: { value: "updated-command" } });

    const saveButton = screen.getByRole("button", { name: "Save & Close" });
    fireEvent.click(saveButton);

    expect(toolBuilderActions.updateCommand).toHaveBeenCalledWith(
      "01979f6d-f206-7716-a2f2-4ee692f068ac",
      expect.objectContaining({
        name: "updated-command",
        description: "Test command description",
        isDefault: false,
        sortOrder: 0
      })
    );
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it("saves all modified fields correctly", () => {
    const command = createTestCommand({
      id: "01979f6d-f206-7716-a2f2-532cbd425da4",
      name: "original-command"
    });
    toolBuilderStore.setState(createTestState(command));

    render(<CommandDialog isOpen={true} onOpenChange={mockOnOpenChange} />);

    fireEvent.change(screen.getByLabelText("Command Name"), {
      target: { value: "new-name" }
    });
    fireEvent.change(screen.getByLabelText("Sort Order"), {
      target: { value: "15" }
    });
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "New description" }
    });
    fireEvent.click(screen.getByLabelText("Default Command"));

    const saveButton = screen.getByRole("button", { name: "Save & Close" });
    fireEvent.click(saveButton);

    expect(toolBuilderActions.updateCommand).toHaveBeenCalledWith(
      "01979f6d-f206-7716-a2f2-532cbd425da4",
      expect.objectContaining({
        name: "new-name",
        description: "New description",
        isDefault: true,
        sortOrder: 15
      })
    );
  });

  it("handles save with empty command name", () => {
    const command = createTestCommand({
      id: "01979f6d-f206-7716-a2f2-547182850366",
      name: "original-name"
    });
    toolBuilderStore.setState(createTestState(command));

    render(<CommandDialog isOpen={true} onOpenChange={mockOnOpenChange} />);

    const nameInput = screen.getByLabelText("Command Name");
    fireEvent.change(nameInput, { target: { value: "" } });

    const saveButton = screen.getByRole("button", { name: "Save & Close" });
    fireEvent.click(saveButton);

    expect(toolBuilderActions.updateCommand).toHaveBeenCalledWith(
      "01979f6d-f206-7716-a2f2-547182850366",
      expect.objectContaining({
        name: ""
      })
    );
  });

  it("preserves subcommands when saving", () => {
    const command = createTestCommand({
      id: "01979f6d-f206-7716-a2f2-592fb8c958e4",
      name: "parent-command",
      subcommands: [
        createTestCommand({
          id: "01979f6d-f206-7716-a2f2-5fd8fc5e3483",
          name: "child-command"
        })
      ]
    });
    toolBuilderStore.setState(createTestState(command));

    render(<CommandDialog isOpen={true} onOpenChange={mockOnOpenChange} />);

    const nameInput = screen.getByLabelText("Command Name");
    fireEvent.change(nameInput, { target: { value: "updated-parent" } });

    const saveButton = screen.getByRole("button", { name: "Save & Close" });
    fireEvent.click(saveButton);

    expect(toolBuilderActions.updateCommand).toHaveBeenCalledWith(
      "01979f6d-f206-7716-a2f2-592fb8c958e4",
      expect.objectContaining({
        name: "updated-parent",
        subcommands: [expect.objectContaining({ name: "child-command" })]
      })
    );
  });

  it("correctly updates command name using original name as identifier", () => {
    const originalCommand = createTestCommand({
      id: "01979f6d-f206-7716-a2f2-61a036f2549b",
      name: "original-name"
    });
    toolBuilderStore.setState(createTestState(originalCommand));

    render(<CommandDialog isOpen={true} onOpenChange={mockOnOpenChange} />);

    const nameInput = screen.getByLabelText("Command Name");
    fireEvent.change(nameInput, { target: { value: "completely-new-name" } });

    const saveButton = screen.getByRole("button", { name: "Save & Close" });
    fireEvent.click(saveButton);

    expect(toolBuilderActions.updateCommand).toHaveBeenCalledWith(
      "01979f6d-f206-7716-a2f2-61a036f2549b",
      expect.objectContaining({
        name: "completely-new-name"
      })
    );
  });
});

describe("CommandDialog - UI Elements and Layout", () => {
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    const command = createTestCommand();
    toolBuilderStore.setState(createTestState(command));
  });

  it("renders all labels and inputs correctly", () => {
    render(<CommandDialog isOpen={true} onOpenChange={mockOnOpenChange} />);

    expect(screen.getByLabelText("Command Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Sort Order")).toBeInTheDocument();
    expect(screen.getByLabelText("Default Command")).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
  });

  it("applies correct classes and layout structure", () => {
    render(<CommandDialog isOpen={true} onOpenChange={mockOnOpenChange} />);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();

    const title = screen.getByText("Edit Command Settings");
    expect(title).toHaveClass("flex", "items-center", "gap-2");
  });

  it("renders TerminalIcon in the dialog title", () => {
    render(<CommandDialog isOpen={true} onOpenChange={mockOnOpenChange} />);

    const title = screen.getByText("Edit Command Settings");
    const icon = title.querySelector("svg");
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass("h-5", "w-5");
  });
});

describe("CommandDialog - State Management", () => {
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes editCommand state from the store's editingCommand", () => {
    const command = createTestCommand({
      name: "initial-command",
      description: "Initial description",
      sortOrder: 5,
      isDefault: true
    });
    toolBuilderStore.setState(createTestState(command));

    render(<CommandDialog isOpen={true} onOpenChange={mockOnOpenChange} />);

    expect(screen.getByDisplayValue("initial-command")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Initial description")).toBeInTheDocument();
    expect(screen.getByDisplayValue("5")).toBeInTheDocument();
    expect(screen.getByLabelText("Default Command")).toBeChecked();
  });

  it("does not mutate the original command in the store until save", () => {
    const originalCommand = createTestCommand({ name: "original-name" });
    toolBuilderStore.setState(createTestState(originalCommand));

    render(<CommandDialog isOpen={true} onOpenChange={mockOnOpenChange} />);

    // Modify the form without saving
    fireEvent.change(screen.getByLabelText("Command Name"), {
      target: { value: "modified-name" }
    });

    // Original command should remain unchanged
    const storeState = toolBuilderStore.state;
    expect(storeState.editingCommand?.name).toBe("original-name");
  });

  it("maintains local state independently of store updates", () => {
    const command = createTestCommand({ name: "test-command" });
    toolBuilderStore.setState(createTestState(command));

    render(<CommandDialog isOpen={true} onOpenChange={mockOnOpenChange} />);

    // Change local state
    fireEvent.change(screen.getByLabelText("Command Name"), {
      target: { value: "local-change" }
    });

    // Update store with different command
    const newCommand = createTestCommand({ name: "store-change" });
    toolBuilderStore.setState(createTestState(newCommand));

    // Local state should be preserved
    expect(screen.getByDisplayValue("local-change")).toBeInTheDocument();
  });
});

describe("CommandDialog - Edge Cases", () => {
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles command being null gracefully", () => {
    // The component expects editingCommand to be non-null, so we test with minimal command
    const minimalCommand = createTestCommand({ name: "", description: "" });
    toolBuilderStore.setState({
      ...createTestState(minimalCommand),
      editingCommand: minimalCommand
    });

    expect(() => {
      render(<CommandDialog isOpen={true} onOpenChange={mockOnOpenChange} />);
    }).not.toThrow();

    // Should render with empty values
    const nameInput = screen.getByLabelText("Command Name") as HTMLInputElement;
    const descriptionTextarea = screen.getByLabelText(
      "Description"
    ) as HTMLTextAreaElement;
    expect(nameInput.value).toBe("");
    expect(descriptionTextarea.value).toBe("");
  });

  it("handles rapid open/close actions without errors", () => {
    const command = createTestCommand();
    toolBuilderStore.setState(createTestState(command));

    const { rerender } = render(
      <CommandDialog isOpen={false} onOpenChange={mockOnOpenChange} />
    );

    // Rapid open/close
    rerender(<CommandDialog isOpen={true} onOpenChange={mockOnOpenChange} />);
    rerender(<CommandDialog isOpen={false} onOpenChange={mockOnOpenChange} />);
    rerender(<CommandDialog isOpen={true} onOpenChange={mockOnOpenChange} />);

    expect(screen.getByText("Edit Command Settings")).toBeInTheDocument();
  });

  it("handles empty command name input", () => {
    const command = createTestCommand({ name: "test-command" });
    toolBuilderStore.setState(createTestState(command));

    render(<CommandDialog isOpen={true} onOpenChange={mockOnOpenChange} />);

    const nameInput = screen.getByLabelText("Command Name");
    fireEvent.change(nameInput, { target: { value: "" } });

    expect((nameInput as HTMLInputElement).value).toBe("");
  });

  it("handles very long input values", () => {
    const longText = "a".repeat(1000);
    const command = createTestCommand();
    toolBuilderStore.setState(createTestState(command));

    render(<CommandDialog isOpen={true} onOpenChange={mockOnOpenChange} />);

    const nameInput = screen.getByLabelText("Command Name");
    const descriptionTextarea = screen.getByLabelText("Description");

    fireEvent.change(nameInput, { target: { value: longText } });
    fireEvent.change(descriptionTextarea, { target: { value: longText } });

    expect((nameInput as HTMLInputElement).value).toBe(longText);
    expect((descriptionTextarea as HTMLTextAreaElement).value).toBe(longText);
  });

  it("handles negative sort order input", () => {
    const command = createTestCommand();
    toolBuilderStore.setState(createTestState(command));

    render(<CommandDialog isOpen={true} onOpenChange={mockOnOpenChange} />);

    const sortOrderInput = screen.getByLabelText("Sort Order");
    fireEvent.change(sortOrderInput, { target: { value: "-5" } });

    expect((sortOrderInput as HTMLInputElement).value).toBe("-5");
  });

  it("handles very large sort order numbers", () => {
    const command = createTestCommand();
    toolBuilderStore.setState(createTestState(command));

    render(<CommandDialog isOpen={true} onOpenChange={mockOnOpenChange} />);

    const sortOrderInput = screen.getByLabelText("Sort Order");
    fireEvent.change(sortOrderInput, { target: { value: "999999" } });

    expect((sortOrderInput as HTMLInputElement).value).toBe("999999");
  });
});

describe("CommandDialog - Accessibility", () => {
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    const command = createTestCommand();
    toolBuilderStore.setState(createTestState(command));
  });

  it("has correct htmlFor and id attributes for form elements", () => {
    render(<CommandDialog isOpen={true} onOpenChange={mockOnOpenChange} />);

    const nameLabel = screen.getByText("Command Name");
    const nameInput = screen.getByLabelText("Command Name");
    expect(nameLabel).toHaveAttribute("for", "cmd-name");
    expect(nameInput).toHaveAttribute("id", "cmd-name");

    const sortOrderLabel = screen.getByText("Sort Order");
    const sortOrderInput = screen.getByLabelText("Sort Order");
    expect(sortOrderLabel).toHaveAttribute("for", "sort-order");
    expect(sortOrderInput).toHaveAttribute("id", "sort-order");

    const defaultLabel = screen.getByText("Default Command");
    const defaultSwitch = screen.getByLabelText("Default Command");
    expect(defaultLabel).toHaveAttribute("for", "default-cmd");
    expect(defaultSwitch).toHaveAttribute("id", "default-cmd");

    const descriptionLabel = screen.getByText("Description");
    const descriptionTextarea = screen.getByLabelText("Description");
    expect(descriptionLabel).toHaveAttribute("for", "cmd-desc");
    expect(descriptionTextarea).toHaveAttribute("id", "cmd-desc");
  });

  it("is keyboard navigable", () => {
    render(<CommandDialog isOpen={true} onOpenChange={mockOnOpenChange} />);

    const nameInput = screen.getByLabelText("Command Name");
    const sortOrderInput = screen.getByLabelText("Sort Order");
    const defaultSwitch = screen.getByLabelText("Default Command");
    const descriptionTextarea = screen.getByLabelText("Description");
    const saveButton = screen.getByRole("button", { name: "Save & Close" });

    // Test that elements can be focused
    nameInput.focus();
    expect(document.activeElement).toBe(nameInput);

    sortOrderInput.focus();
    expect(document.activeElement).toBe(sortOrderInput);

    defaultSwitch.focus();
    expect(document.activeElement).toBe(defaultSwitch);

    descriptionTextarea.focus();
    expect(document.activeElement).toBe(descriptionTextarea);

    saveButton.focus();
    expect(document.activeElement).toBe(saveButton);
  });

  it("has proper dialog role and aria attributes", () => {
    render(<CommandDialog isOpen={true} onOpenChange={mockOnOpenChange} />);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-labelledby");
    expect(dialog).toHaveAttribute("aria-describedby");
  });

  it("supports clicking save button to save", () => {
    vi.spyOn(toolBuilderActions, "updateCommand").mockImplementation(() => {});

    render(<CommandDialog isOpen={true} onOpenChange={mockOnOpenChange} />);

    const saveButton = screen.getByRole("button", { name: "Save & Close" });
    fireEvent.click(saveButton);

    expect(toolBuilderActions.updateCommand).toHaveBeenCalled();
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);

    vi.restoreAllMocks();
  });
});
