import { Command } from "@/registry/commandly/lib/types/commandly";
import { defaultTool } from "@/registry/commandly/lib/utils/commandly";
import { CommandDialog } from "@/registry/commandly/tool-editor/dialogs/command-dialog";
import {
  ToolBuilderProvider,
  ToolBuilderState,
  useToolBuilder,
} from "@/registry/commandly/tool-editor/tool-editor.context";
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
  editingCommand: command,
});

// Captures the latest context value so tests can verify state changes
let capturedCtx: ReturnType<typeof useToolBuilder>;
function ContextCapture() {
  capturedCtx = useToolBuilder();
  return null;
}

function renderWithProvider(ui: ReactNode, initialState: Partial<ToolBuilderState>) {
  return render(
    <ToolBuilderProvider
      tool={initialState.tool ?? defaultTool("test-tool", "Test tool")}
      initialState={initialState}
    >
      {ui}
      <ContextCapture />
    </ToolBuilderProvider>,
  );
}

describe("CommandDialog - Rendering & Structure", () => {
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the dialog when isOpen is true", () => {
    const testCommand = createTestCommand();
    renderWithProvider(
      <CommandDialog
        isOpen={true}
        onOpenChange={mockOnOpenChange}
      />,
      createTestState(testCommand),
    );

    expect(screen.getByText("Edit Command Settings")).toBeInTheDocument();
    expect(screen.getByLabelText("Command Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Sort Order")).toBeInTheDocument();
    expect(screen.getByLabelText("Default Command")).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save & Close" })).toBeInTheDocument();
  });

  it("does not render dialog content when isOpen is false", () => {
    const testCommand = createTestCommand();
    renderWithProvider(
      <CommandDialog
        isOpen={false}
        onOpenChange={mockOnOpenChange}
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
        />
        <ContextCapture />
      </ToolBuilderProvider>,
    );

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
    renderWithProvider(
      <CommandDialog
        isOpen={true}
        onOpenChange={mockOnOpenChange}
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
      />,
      createTestState(command),
    );

    const descriptionTextarea = screen.getByLabelText("Description");
    fireEvent.change(descriptionTextarea, { target: { value: "New description" } });

    expect((descriptionTextarea as HTMLTextAreaElement).value).toBe("New description");
  });
});

describe("CommandDialog - Default Command Switch", () => {
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reflects current isDefault state", () => {
    const command = createTestCommand({ isDefault: true });
    renderWithProvider(
      <CommandDialog
        isOpen={true}
        onOpenChange={mockOnOpenChange}
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
      />,
      createTestState(command),
    );

    const defaultSwitch = screen.getByLabelText("Default Command");
    expect(defaultSwitch).toBeDisabled();
  });
});

describe("CommandDialog - Save Functionality", () => {
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates command in context and closes dialog when Save & Close is clicked", () => {
    const command = createTestCommand({
      key: "original-command-key",
      name: "original-command",
    });
    renderWithProvider(
      <CommandDialog
        isOpen={true}
        onOpenChange={mockOnOpenChange}
      />,
      createTestState(command),
    );

    const nameInput = screen.getByLabelText("Command Name");
    fireEvent.change(nameInput, { target: { value: "updated-command" } });

    const saveButton = screen.getByRole("button", { name: "Save & Close" });
    fireEvent.click(saveButton);

    const updatedCommand = capturedCtx.tool.commands.find((c) => c.key === "original-command-key");
    expect(updatedCommand?.name).toBe("updated-command");
    expect(updatedCommand?.description).toBe("Test command description");
    expect(updatedCommand?.isDefault).toBe(false);
    expect(updatedCommand?.sortOrder).toBe(0);
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
      />,
      createTestState(command),
    );

    fireEvent.change(screen.getByLabelText("Command Name"), { target: { value: "new-name" } });
    fireEvent.change(screen.getByLabelText("Sort Order"), { target: { value: "15" } });
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "New description" },
    });
    fireEvent.click(screen.getByLabelText("Default Command"));

    const saveButton = screen.getByRole("button", { name: "Save & Close" });
    fireEvent.click(saveButton);

    const updatedCommand = capturedCtx.tool.commands.find((c) => c.key === "original-command-key");
    expect(updatedCommand?.name).toBe("new-name");
    expect(updatedCommand?.description).toBe("New description");
    expect(updatedCommand?.isDefault).toBe(true);
    expect(updatedCommand?.sortOrder).toBe(15);
  });

  it("handles save with empty command name", () => {
    const command = createTestCommand({
      key: "original-name-key",
      name: "original-name",
    });
    renderWithProvider(
      <CommandDialog
        isOpen={true}
        onOpenChange={mockOnOpenChange}
      />,
      createTestState(command),
    );

    const nameInput = screen.getByLabelText("Command Name");
    fireEvent.change(nameInput, { target: { value: "" } });

    const saveButton = screen.getByRole("button", { name: "Save & Close" });
    fireEvent.click(saveButton);

    const updatedCommand = capturedCtx.tool.commands.find((c) => c.key === "original-name-key");
    expect(updatedCommand?.name).toBe("");
  });

  it("preserves subcommands when saving", () => {
    const command = createTestCommand({
      key: "parent-command-key",
      name: "parent-command",
    });
    renderWithProvider(
      <CommandDialog
        isOpen={true}
        onOpenChange={mockOnOpenChange}
      />,
      createTestState(command),
    );

    const nameInput = screen.getByLabelText("Command Name");
    fireEvent.change(nameInput, { target: { value: "updated-parent" } });

    const saveButton = screen.getByRole("button", { name: "Save & Close" });
    fireEvent.click(saveButton);

    const updatedCommand = capturedCtx.tool.commands.find((c) => c.key === "parent-command-key");
    expect(updatedCommand?.name).toBe("updated-parent");
  });

  it("correctly updates command name using original key as identifier", () => {
    const originalCommand = createTestCommand({
      key: "original-name-key",
      name: "original-name",
    });
    renderWithProvider(
      <CommandDialog
        isOpen={true}
        onOpenChange={mockOnOpenChange}
      />,
      createTestState(originalCommand),
    );

    const nameInput = screen.getByLabelText("Command Name");
    fireEvent.change(nameInput, { target: { value: "completely-new-name" } });

    const saveButton = screen.getByRole("button", { name: "Save & Close" });
    fireEvent.click(saveButton);

    const updatedCommand = capturedCtx.tool.commands.find((c) => c.key === "original-name-key");
    expect(updatedCommand?.name).toBe("completely-new-name");
  });
});

describe("CommandDialog - UI Elements and Layout", () => {
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all labels and inputs correctly", () => {
    const command = createTestCommand();
    renderWithProvider(
      <CommandDialog
        isOpen={true}
        onOpenChange={mockOnOpenChange}
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
      />,
      createTestState(command),
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();

    const title = screen.getByText("Edit Command Settings");
    expect(title).toHaveClass("flex", "items-center", "gap-2");
  });
});
