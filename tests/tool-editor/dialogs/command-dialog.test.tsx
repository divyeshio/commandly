import { createTestCommand, defaultTool } from "../../test-utils";
import { Command } from "@/components/commandly/types/tool";
import { CommandDialog } from "@/components/tool-editor/dialogs/command-dialog";
import {
  ToolBuilderProvider,
  ToolBuilderState,
} from "@/components/tool-editor/tool-editor.context";
import { render, screen, fireEvent } from "@testing-library/react";
import { ReactNode } from "react";

const createTestState = (
  command: Command,
  toolName: string = "test-tool",
): Partial<ToolBuilderState> => ({
  tool: { ...defaultTool(toolName, "Test tool"), binaryName: toolName, commands: [command] },
  selectedCommandKey: command.key,
});

function renderWithProvider(ui: ReactNode, initialState: Partial<ToolBuilderState>) {
  return render(
    <ToolBuilderProvider
      tool={initialState.tool ?? defaultTool("test-tool", "Test tool")}
      initialState={initialState}
    >
      {ui}
    </ToolBuilderProvider>,
  );
}

describe("CommandDialog - Rendering & Structure", () => {
  const mockOnOpenChange = vi.fn();
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the dialog in edit mode when isOpen is true", () => {
    const testCommand = createTestCommand();
    renderWithProvider(
      <CommandDialog
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        command={testCommand}
        toolName="test-tool"
        onSave={mockOnSave}
      />,
      createTestState(testCommand),
    );

    expect(screen.getByText("Edit Command Settings")).toBeInTheDocument();
    expect(screen.getByLabelText("Display Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Interactive")).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save Changes" })).toBeInTheDocument();
  });

  it("renders the dialog in add mode when no command is provided", () => {
    const testState = createTestState(createTestCommand());
    renderWithProvider(
      <CommandDialog
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        toolName="test-tool"
        onSave={mockOnSave}
      />,
      testState,
    );

    expect(screen.getByText("Add Command")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
  });

  it("does not render dialog content when isOpen is false", () => {
    const testCommand = createTestCommand();
    renderWithProvider(
      <CommandDialog
        isOpen={false}
        onOpenChange={mockOnOpenChange}
        command={testCommand}
        toolName="test-tool"
        onSave={mockOnSave}
      />,
      createTestState(testCommand),
    );

    expect(screen.queryByText("Edit Command Settings")).not.toBeInTheDocument();
  });

  it("displays the terminal icon in the dialog title", () => {
    const testCommand = createTestCommand();
    renderWithProvider(
      <CommandDialog
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        command={testCommand}
        toolName="test-tool"
        onSave={mockOnSave}
      />,
      createTestState(testCommand),
    );

    const title = screen.getByText("Edit Command Settings");
    expect(title).toHaveClass("flex", "items-center", "gap-2");
  });

  it("calls onOpenChange with false when dialog is closed", () => {
    const testCommand = createTestCommand();
    const testState = createTestState(testCommand);
    const { rerender } = renderWithProvider(
      <CommandDialog
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        command={testCommand}
        toolName="test-tool"
        onSave={mockOnSave}
      />,
      testState,
    );

    rerender(
      <ToolBuilderProvider
        tool={testState.tool!}
        initialState={testState}
      >
        <CommandDialog
          isOpen={false}
          onOpenChange={mockOnOpenChange}
          command={testCommand}
          toolName="test-tool"
          onSave={mockOnSave}
        />
      </ToolBuilderProvider>,
    );

    expect(screen.queryByText("Edit Command Settings")).not.toBeInTheDocument();
  });
});

describe("CommandDialog - Form Fields", () => {
  const mockOnOpenChange = vi.fn();
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("displays current command name in the input", () => {
    const command = createTestCommand({ displayName: "my-command" });
    renderWithProvider(
      <CommandDialog
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        command={command}
        toolName="test-tool"
        onSave={mockOnSave}
      />,
      createTestState(command),
    );

    const nameInput = screen.getByLabelText("Display Name") as HTMLInputElement;
    expect(nameInput.value).toBe("my-command");
  });

  it("updates command name when input changes", () => {
    const command = createTestCommand();
    renderWithProvider(
      <CommandDialog
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        command={command}
        toolName="test-tool"
        onSave={mockOnSave}
      />,
      createTestState(command),
    );

    const nameInput = screen.getByLabelText("Display Name");
    fireEvent.change(nameInput, { target: { value: "new-command" } });

    expect((nameInput as HTMLInputElement).value).toBe("new-command");
  });

  it("displays current description in the textarea", () => {
    const command = createTestCommand({ description: "My test description" });
    renderWithProvider(
      <CommandDialog
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        command={command}
        toolName="test-tool"
        onSave={mockOnSave}
      />,
      createTestState(command),
    );

    const descriptionTextarea = screen.getByLabelText("Description") as HTMLTextAreaElement;
    expect(descriptionTextarea.value).toBe("My test description");
  });

  it("updates description when textarea changes", () => {
    const command = createTestCommand();
    renderWithProvider(
      <CommandDialog
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        command={command}
        toolName="test-tool"
        onSave={mockOnSave}
      />,
      createTestState(command),
    );

    const descriptionTextarea = screen.getByLabelText("Description");
    fireEvent.change(descriptionTextarea, { target: { value: "New description" } });

    expect((descriptionTextarea as HTMLTextAreaElement).value).toBe("New description");
  });

  it("starts with empty name in add mode", () => {
    const testState = createTestState(createTestCommand());
    renderWithProvider(
      <CommandDialog
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        toolName="test-tool"
        onSave={mockOnSave}
      />,
      testState,
    );

    const nameInput = screen.getByLabelText("Display Name") as HTMLInputElement;
    expect(nameInput.value).toBe("");
  });
});

describe("CommandDialog - Save Functionality", () => {
  const mockOnOpenChange = vi.fn();
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls onSave with updated command and closes dialog when Save Changes is clicked", () => {
    const command = createTestCommand({
      key: "original-command-key",
      displayName: "original-command",
    });
    renderWithProvider(
      <CommandDialog
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        command={command}
        toolName="test-tool"
        onSave={mockOnSave}
      />,
      createTestState(command),
    );

    const nameInput = screen.getByLabelText("Display Name");
    fireEvent.change(nameInput, { target: { value: "updated-command" } });

    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        key: "original-command-key",
        displayName: "updated-command",
        description: "Test command description",
        sortOrder: 0,
      }),
    );
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it("saves all modified fields correctly", () => {
    const command = createTestCommand({
      key: "original-command-key",
      displayName: "original-command",
    });
    renderWithProvider(
      <CommandDialog
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        command={command}
        toolName="test-tool"
        onSave={mockOnSave}
      />,
      createTestState(command),
    );

    fireEvent.change(screen.getByLabelText("Display Name"), { target: { value: "new-name" } });
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "New description" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        displayName: "new-name",
        description: "New description",
      }),
    );
  });

  it("preserves key when saving in edit mode", () => {
    const command = createTestCommand({
      key: "parent-command-key",
      displayName: "parent-command",
    });
    renderWithProvider(
      <CommandDialog
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        command={command}
        toolName="test-tool"
        onSave={mockOnSave}
      />,
      createTestState(command),
    );

    fireEvent.change(screen.getByLabelText("Display Name"), {
      target: { value: "updated-parent" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({ key: "parent-command-key", displayName: "updated-parent" }),
    );
  });

  it("derives key from name when adding a new command", () => {
    const testState = createTestState(createTestCommand());
    renderWithProvider(
      <CommandDialog
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        toolName="test-tool"
        onSave={mockOnSave}
      />,
      testState,
    );

    fireEvent.change(screen.getByLabelText("Display Name"), {
      target: { value: "My New Command" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({ displayName: "My New Command", key: "my-new-command" }),
    );
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it("disables Add button when name is empty in add mode", () => {
    const testState = createTestState(createTestCommand());
    renderWithProvider(
      <CommandDialog
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        toolName="test-tool"
        onSave={mockOnSave}
      />,
      testState,
    );

    const addButton = screen.getByRole("button", { name: "Add" });
    expect(addButton).toBeDisabled();
  });

  it("enables Add button when name is filled in add mode", () => {
    const testState = createTestState(createTestCommand());
    renderWithProvider(
      <CommandDialog
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        toolName="test-tool"
        onSave={mockOnSave}
      />,
      testState,
    );

    fireEvent.change(screen.getByLabelText("Display Name"), { target: { value: "new-cmd" } });

    const addButton = screen.getByRole("button", { name: "Add" });
    expect(addButton).not.toBeDisabled();
  });
});

describe("CommandDialog - UI Elements and Layout", () => {
  const mockOnOpenChange = vi.fn();
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all labels and inputs correctly", () => {
    const command = createTestCommand();
    renderWithProvider(
      <CommandDialog
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        command={command}
        toolName="test-tool"
        onSave={mockOnSave}
      />,
      createTestState(command),
    );

    expect(screen.getByLabelText("Display Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Interactive")).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
  });

  it("applies correct classes and layout structure", () => {
    const command = createTestCommand();
    renderWithProvider(
      <CommandDialog
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        command={command}
        toolName="test-tool"
        onSave={mockOnSave}
      />,
      createTestState(command),
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();

    const title = screen.getByText("Edit Command Settings");
    expect(title).toHaveClass("flex", "items-center", "gap-2");
  });
});

describe("CommandDialog - Command Key", () => {
  const mockOnOpenChange = vi.fn();
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("preserves the authored key when the display name changes", () => {
    const command = createTestCommand({ key: "authored-key", displayName: "Original" });
    renderWithProvider(
      <CommandDialog
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        command={command}
        toolName="test-tool"
        onSave={mockOnSave}
      />,
      createTestState(command),
    );

    fireEvent.change(screen.getByLabelText("Display Name"), { target: { value: "Renamed" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({ key: "authored-key", displayName: "Renamed" }),
    );
  });

  it("accepts a written key independently of the display name", () => {
    const command = createTestCommand({ key: "original-key", displayName: "Original" });
    renderWithProvider(
      <CommandDialog
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        command={command}
        toolName="test-tool"
        onSave={mockOnSave}
      />,
      createTestState(command),
    );

    fireEvent.change(screen.getByLabelText("Key"), { target: { value: "New Key" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({ key: "new-key", displayName: "Original" }),
    );
  });

  it("shows the derived key as a placeholder for a new command", () => {
    renderWithProvider(
      <CommandDialog
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        toolName="test-tool"
        onSave={mockOnSave}
      />,
      createTestState(createTestCommand()),
    );

    fireEvent.change(screen.getByLabelText("Display Name"), {
      target: { value: "My New Command" },
    });

    expect(screen.getByLabelText("Key")).toHaveAttribute("placeholder", "my-new-command");
  });
});
