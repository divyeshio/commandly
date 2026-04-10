import { Command } from "@/components/commandly/types/flat";
import { CommandDialog } from "@/components/tool-editor/dialogs/command-dialog";
import {
  ToolBuilderProvider,
  ToolBuilderState,
} from "@/components/tool-editor/tool-editor.context";
import { defaultTool } from "@/lib/utils";
import { render, screen, fireEvent } from "@testing-library/react";
import { ReactNode } from "react";

const createTestCommand = (overrides: Partial<Command> = {}): Command => ({
  key: "test-command-key",
  name: "test-command",
  description: "Test command description",
  isDefault: false,
  sortOrder: 0,
  ...overrides,
});

const createTestState = (
  command: Command,
  toolName: string = "test-tool",
): Partial<ToolBuilderState> => ({
  tool: { ...defaultTool(toolName, "Test tool"), name: toolName, commands: [command] },
  selectedCommand: command,
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
    expect(screen.getByLabelText("Command Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Sort Order")).toBeInTheDocument();
    expect(screen.getByLabelText("Default Command")).toBeInTheDocument();
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
    const command = createTestCommand({ name: "my-command" });
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

    const nameInput = screen.getByLabelText("Command Name") as HTMLInputElement;
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

    const nameInput = screen.getByLabelText("Command Name");
    fireEvent.change(nameInput, { target: { value: "new-command" } });

    expect((nameInput as HTMLInputElement).value).toBe("new-command");
  });

  it("disables command name input when command name matches tool name", () => {
    const command = createTestCommand({ name: "test-tool" });
    renderWithProvider(
      <CommandDialog
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        command={command}
        toolName="test-tool"
        onSave={mockOnSave}
      />,
      createTestState(command, "test-tool"),
    );

    const nameInput = screen.getByLabelText("Command Name");
    expect(nameInput).toBeDisabled();
  });

  it("displays current sort order in the input", () => {
    const command = createTestCommand({ sortOrder: 5 });
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

    const sortOrderInput = screen.getByLabelText("Sort Order") as HTMLInputElement;
    expect(sortOrderInput.value).toBe("5");
  });

  it("updates sort order when input changes", () => {
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

    const sortOrderInput = screen.getByLabelText("Sort Order");
    fireEvent.change(sortOrderInput, { target: { value: "10" } });

    expect((sortOrderInput as HTMLInputElement).value).toBe("10");
  });

  it("defaults sort order to 0 for invalid input", () => {
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

    const sortOrderInput = screen.getByLabelText("Sort Order");
    fireEvent.change(sortOrderInput, { target: { value: "invalid" } });

    expect((sortOrderInput as HTMLInputElement).value).toBe("0");
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

    const nameInput = screen.getByLabelText("Command Name") as HTMLInputElement;
    expect(nameInput.value).toBe("");
  });
});

describe("CommandDialog - Default Command Switch", () => {
  const mockOnOpenChange = vi.fn();
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reflects current isDefault state", () => {
    const command = createTestCommand({ isDefault: true });
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

    const defaultSwitch = screen.getByLabelText("Default Command");
    expect(defaultSwitch).toBeChecked();
  });

  it("updates isDefault when switch is toggled", () => {
    const command = createTestCommand({ isDefault: false });
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

    const defaultSwitch = screen.getByLabelText("Default Command");
    fireEvent.click(defaultSwitch);

    expect(defaultSwitch).toBeChecked();
  });

  it("disables switch when command is already default", () => {
    const command = createTestCommand({ isDefault: true });
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

    const defaultSwitch = screen.getByLabelText("Default Command");
    expect(defaultSwitch).toBeDisabled();
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
      name: "original-command",
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

    const nameInput = screen.getByLabelText("Command Name");
    fireEvent.change(nameInput, { target: { value: "updated-command" } });

    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        key: "original-command-key",
        name: "updated-command",
        description: "Test command description",
        isDefault: false,
        sortOrder: 0,
      }),
    );
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it("saves all modified fields correctly", () => {
    const command = createTestCommand({
      key: "original-command-key",
      name: "original-command",
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

    fireEvent.change(screen.getByLabelText("Command Name"), { target: { value: "new-name" } });
    fireEvent.change(screen.getByLabelText("Sort Order"), { target: { value: "15" } });
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "New description" },
    });
    fireEvent.click(screen.getByLabelText("Default Command"));

    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "new-name",
        description: "New description",
        isDefault: true,
        sortOrder: 15,
      }),
    );
  });

  it("preserves key when saving in edit mode", () => {
    const command = createTestCommand({
      key: "parent-command-key",
      name: "parent-command",
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

    fireEvent.change(screen.getByLabelText("Command Name"), { target: { value: "updated-parent" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({ key: "parent-command-key", name: "updated-parent" }),
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

    fireEvent.change(screen.getByLabelText("Command Name"), { target: { value: "My New Command" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({ name: "My New Command", key: "my-new-command" }),
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

    fireEvent.change(screen.getByLabelText("Command Name"), { target: { value: "new-cmd" } });

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

    expect(screen.getByLabelText("Command Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Sort Order")).toBeInTheDocument();
    expect(screen.getByLabelText("Default Command")).toBeInTheDocument();
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
