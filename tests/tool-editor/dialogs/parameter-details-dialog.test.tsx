import { Parameter, Command } from "@/components/commandly/types/flat";
import { createNewParameter } from "@/components/commandly/utils/flat";
import { ParameterDetailsDialog } from "@/components/tool-editor/dialogs/parameter-details-dialog";
import {
  ToolBuilderProvider,
  ToolBuilderState,
  useToolBuilder,
} from "@/components/tool-editor/tool-editor.context";
import { defaultTool } from "@/lib/utils";
import { render, screen, fireEvent, act } from "@testing-library/react";

const createTestParameter = (overrides: Partial<Parameter> = {}): Parameter => ({
  key: "test-param-key",
  name: "test-param",
  commandKey: "test-command-key",
  description: "Test parameter description",
  parameterType: "Option",
  dataType: "String",
  isRequired: false,
  isRepeatable: false,
  isGlobal: false,
  longFlag: "--test",
  ...overrides,
});

const createTestCommand = (overrides: Partial<Command> = {}): Command => ({
  key: "test-command-key",
  name: "test-command",
  description: "Test command description",
  isDefault: false,
  sortOrder: 0,
  ...overrides,
});

const createTestState = (
  parameter: Parameter | null,
  toolName: string = "test-tool",
  command?: Command,
): Partial<ToolBuilderState> => ({
  tool: { ...defaultTool(toolName, "Test tool"), name: toolName },
  selectedCommand: command || createTestCommand(),
  selectedParameter: parameter,
});

// Captures the latest context value after each render
let capturedCtx: ReturnType<typeof useToolBuilder>;
function ContextCapture() {
  capturedCtx = useToolBuilder();
  return null;
}

function DialogWrapper() {
  const { selectedParameter, upsertParameter, setSelectedParameter } = useToolBuilder();
  if (!selectedParameter) return null;
  return (
    <ParameterDetailsDialog
      parameter={selectedParameter.key ? selectedParameter : undefined}
      onSave={(param) => {
        upsertParameter(param, selectedParameter.key || undefined);
        setSelectedParameter(null);
      }}
    />
  );
}

function renderWithProvider(initialState: Partial<ToolBuilderState>) {
  return render(
    <ToolBuilderProvider
      tool={initialState.tool ?? defaultTool("test-tool", "Test tool")}
      initialState={initialState}
    >
      <DialogWrapper />
      <ContextCapture />
    </ToolBuilderProvider>,
  );
}

describe("ParameterDetailsDialog - Dialog Lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("manages dialog open/close states and store synchronization", () => {
    const testParameter = createTestParameter();

    renderWithProvider(createTestState(testParameter));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("test-param")).toBeInTheDocument();
    expect(capturedCtx.selectedParameter).toEqual(testParameter);

    // Closes when parameter is deselected via context action
    act(() => {
      capturedCtx.setSelectedParameter(null);
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(capturedCtx.selectedParameter).toBeNull();
  });
});

describe("ParameterDetailsDialog - Form Fields", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("displays and updates basic form fields", () => {
    const testParameter = createTestParameter({
      name: "my-parameter",
      description: "Initial description",
      parameterType: "Option",
      dataType: "String",
    });

    renderWithProvider(createTestState(testParameter));

    // Check initial values
    expect(screen.getByDisplayValue("my-parameter")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Initial description")).toBeInTheDocument();
    expect(screen.getByText("Option")).toBeInTheDocument();
    expect(screen.getByText("String")).toBeInTheDocument();

    // Update name and description
    const nameInput = screen.getByDisplayValue("my-parameter");
    const descriptionTextarea = screen.getByDisplayValue("Initial description");

    act(() => {
      fireEvent.change(nameInput, { target: { value: "updated-param" } });
      fireEvent.change(descriptionTextarea, { target: { value: "Updated description" } });
    });

    expect(screen.getByDisplayValue("updated-param")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Updated description")).toBeInTheDocument();
  });

  it("handles parameter type and data type changes", () => {
    const testParameter = createTestParameter({
      parameterType: "Option",
      dataType: "String",
    });

    renderWithProvider(createTestState(testParameter));

    const selectElements = screen.getAllByRole("combobox");
    const parameterTypeSelect = selectElements[0];
    const dataTypeSelect = selectElements[1];

    // Switch to Flag — dataType is auto-set to Boolean, only Boolean is in the list
    act(() => {
      fireEvent.click(parameterTypeSelect);
    });
    act(() => {
      fireEvent.click(screen.getByRole("option", { name: "Flag" }));
    });
    expect(screen.getByText("Flag")).toBeInTheDocument();
    expect(screen.getByText("Boolean")).toBeInTheDocument();

    // Switch back to Option — change data type to Enum
    act(() => {
      fireEvent.click(parameterTypeSelect);
    });
    act(() => {
      fireEvent.click(screen.getByRole("option", { name: "Option" }));
    });

    act(() => {
      fireEvent.click(dataTypeSelect);
    });
    act(() => {
      fireEvent.click(screen.getByRole("option", { name: "Enum" }));
    });
    expect(screen.getByText("Enum")).toBeInTheDocument();
  });

  it("handles switch toggles for boolean properties", () => {
    const testParameter = createTestParameter({
      isRequired: false,
      isGlobal: false,
      isRepeatable: false,
    });

    renderWithProvider(createTestState(testParameter));

    const switches = screen.getAllByRole("switch");
    const requiredSwitch = switches.find((s) =>
      s.closest("div")?.textContent?.includes("Required"),
    );
    const globalSwitch = switches.find((s) => s.closest("div")?.textContent?.includes("Global"));
    const repeatableSwitch = switches.find((s) =>
      s.closest("div")?.textContent?.includes("Repeatable"),
    );

    // Initial state
    expect(requiredSwitch).not.toBeChecked();
    expect(globalSwitch).not.toBeChecked();
    expect(repeatableSwitch).not.toBeChecked();

    // Toggle switches
    act(() => {
      fireEvent.click(requiredSwitch!);
      fireEvent.click(globalSwitch!);
      fireEvent.click(repeatableSwitch!);
    });

    expect(requiredSwitch).toBeChecked();
    expect(globalSwitch).toBeChecked();
    expect(repeatableSwitch).toBeChecked();
  });

  it("validates empty parameter name", () => {
    const testParameter = createTestParameter();
    const initState = { ...createTestState(testParameter) };
    initState.tool = { ...defaultTool("test-tool", "Test tool"), parameters: [testParameter] };
    renderWithProvider(initState);

    const nameInput = screen.getByDisplayValue("test-param");
    const saveButton = screen.getByRole("button", { name: "Save Changes" });

    act(() => {
      fireEvent.change(nameInput, { target: { value: "" } });
    });

    expect(saveButton).toBeDisabled();
  });
});

describe("ParameterDetailsDialog - Parameter Type Specific Fields", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("conditionally renders fields based on parameter type", () => {
    const flagParameter = createTestParameter({ parameterType: "Flag", dataType: "Boolean" });
    renderWithProvider(createTestState(flagParameter));

    // Flag type shows flag fields but not key-value separator
    expect(screen.getByText("Short Flag (include prefix)")).toBeInTheDocument();
    expect(screen.getByText("Long Flag (include prefix)")).toBeInTheDocument();
    expect(screen.queryByText("Key-Value Separator")).not.toBeInTheDocument();

    // Switch to Option type
    const selectElements = screen.getAllByRole("combobox");
    const parameterTypeSelect = selectElements[0];

    act(() => {
      fireEvent.click(parameterTypeSelect);
    });
    act(() => {
      fireEvent.click(screen.getByRole("option", { name: "Option" }));
    });

    // Option type shows all fields including key-value separator
    expect(screen.getByText("Short Flag (include prefix)")).toBeInTheDocument();
    expect(screen.getByText("Long Flag (include prefix)")).toBeInTheDocument();
    expect(screen.getByText("Key-Value Separator")).toBeInTheDocument();

    // Switch to Argument type
    act(() => {
      fireEvent.click(parameterTypeSelect);
    });
    act(() => {
      fireEvent.click(screen.getByRole("option", { name: "Argument" }));
    });

    // Argument type hides flag fields
    expect(screen.queryByText("Short Flag (include prefix)")).not.toBeInTheDocument();
    expect(screen.queryByText("Long Flag (include prefix)")).not.toBeInTheDocument();
    expect(screen.queryByText("Key-Value Separator")).not.toBeInTheDocument();
  });

  it("updates Key-Value Separator when changed", () => {
    const testParameter = createTestParameter({
      parameterType: "Option",
      keyValueSeparator: "=",
    });

    renderWithProvider(createTestState(testParameter));

    const separatorInput = screen.getByDisplayValue("=");

    act(() => {
      fireEvent.change(separatorInput, { target: { value: ":" } });
    });

    expect(screen.getByDisplayValue(":")).toBeInTheDocument();
  });

  it("keeps focus on enum value input while typing", () => {
    const testParameter = createTestParameter({
      dataType: "Enum",
      enum: {
        values: [
          {
            value: "one",
            displayName: "One",
            isDefault: false,
            sortOrder: 0,
          },
        ],
        allowMultiple: false,
      },
    });

    renderWithProvider(createTestState(testParameter));

    const valueInput = screen.getByDisplayValue("one");
    valueInput.focus();

    act(() => {
      fireEvent.change(valueInput, { target: { value: "two" } });
    });

    expect(screen.getByDisplayValue("two")).toBeInTheDocument();
    expect(document.activeElement).toBe(screen.getByDisplayValue("two"));
  });

  it("hides the Repeatable switch for Flag parameters and shows it for Option/Argument", () => {
    const flagParameter = createTestParameter({ parameterType: "Flag", dataType: "Boolean" });
    renderWithProvider(createTestState(flagParameter));

    expect(screen.queryByText("Repeatable")).not.toBeInTheDocument();

    const selectElements = screen.getAllByRole("combobox");
    const parameterTypeSelect = selectElements[0];

    act(() => {
      fireEvent.click(parameterTypeSelect);
    });
    act(() => {
      fireEvent.click(screen.getByRole("option", { name: "Option" }));
    });

    expect(screen.getByText("Repeatable")).toBeInTheDocument();

    act(() => {
      fireEvent.click(parameterTypeSelect);
    });
    act(() => {
      fireEvent.click(screen.getByRole("option", { name: "Argument" }));
    });

    expect(screen.getByText("Repeatable")).toBeInTheDocument();

    act(() => {
      fireEvent.click(parameterTypeSelect);
    });
    act(() => {
      fireEvent.click(screen.getByRole("option", { name: "Flag" }));
    });

    expect(screen.queryByText("Repeatable")).not.toBeInTheDocument();
  });

  it("auto-sets Boolean when switching to Flag and resets to String when switching to Option/Argument", () => {
    const testParameter = createTestParameter({ parameterType: "Option", dataType: "String" });
    renderWithProvider(createTestState(testParameter));

    const parameterTypeSelect = screen.getAllByRole("combobox")[0];

    // Option → Flag: dataType auto-set to Boolean, only Boolean in list
    act(() => { fireEvent.click(parameterTypeSelect); });
    act(() => { fireEvent.click(screen.getByRole("option", { name: "Flag" })); });
    expect(screen.getByText("Boolean")).toBeInTheDocument();

    // Flag → Option: dataType resets to String, all data type options available
    act(() => { fireEvent.click(parameterTypeSelect); });
    act(() => { fireEvent.click(screen.getByRole("option", { name: "Option" })); });
    expect(screen.getByText("String")).toBeInTheDocument();

    // Option → Flag again: dataType auto-set to Boolean
    act(() => { fireEvent.click(parameterTypeSelect); });
    act(() => { fireEvent.click(screen.getByRole("option", { name: "Flag" })); });
    expect(screen.getByText("Boolean")).toBeInTheDocument();

    // Flag → Argument: dataType resets to String, all data type options available
    act(() => { fireEvent.click(parameterTypeSelect); });
    act(() => { fireEvent.click(screen.getByRole("option", { name: "Argument" })); });
    expect(screen.getByText("String")).toBeInTheDocument();
  });
});

describe("ParameterDetailsDialog - Dependencies Section", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("disables Add button when no available parameters", () => {
    const testParameter = createTestParameter();
    const initState: Partial<ToolBuilderState> = {
      ...createTestState(testParameter),
    };
    // Only this parameter — no others available
    initState.tool = { ...defaultTool("test-tool", "Test tool"), parameters: [testParameter] };

    renderWithProvider(initState);

    const addButtons = screen.getAllByRole("button", { name: "Add" });
    const dependenciesAddButton = addButtons[0];

    expect(dependenciesAddButton).toBeDisabled();
    expect(capturedCtx.tool.parameters).toHaveLength(1);
    expect(capturedCtx.tool.parameters[0]).toEqual(testParameter);
  });
});

describe("ParameterDetailsDialog - State Management & Dialog Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("enables save button when changes are made but keeps store unchanged until saved", () => {
    const testParameter = createTestParameter();
    const initState = { ...createTestState(testParameter) };
    initState.tool = { ...defaultTool("test-tool", "Test tool"), parameters: [testParameter] };
    renderWithProvider(initState);

    const saveButton = screen.getByRole("button", { name: "Save Changes" });
    expect(saveButton).toBeDisabled();

    const nameInput = screen.getByDisplayValue("test-param");

    act(() => {
      fireEvent.change(nameInput, { target: { value: "updated-param" } });
    });

    expect(saveButton).not.toBeDisabled();
    // Context selectedParameter should still have the original name (not yet saved)
    expect(capturedCtx.selectedParameter?.name).toBe("test-param");
  });


  it("cancels changes, closes dialog, and preserves original store state", () => {
    const testParameter = createTestParameter({
      name: "original-param",
      description: "Original description",
      isRequired: false,
    });
    const initState: Partial<ToolBuilderState> = {
      ...createTestState(testParameter),
    };
    initState.tool = { ...defaultTool("test-tool", "Test tool"), parameters: [testParameter] };

    renderWithProvider(initState);

    const nameInput = screen.getByDisplayValue("original-param");
    const descriptionTextarea = screen.getByDisplayValue("Original description");

    act(() => {
      fireEvent.change(nameInput, { target: { value: "modified-param" } });
      fireEvent.change(descriptionTextarea, { target: { value: "Modified description" } });
    });

    expect(screen.getByDisplayValue("modified-param")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Modified description")).toBeInTheDocument();

    const cancelButton = screen.getByRole("button", { name: "Cancel" });

    act(() => {
      fireEvent.click(cancelButton);
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(capturedCtx.selectedParameter).toBeNull();

    const originalParameter = capturedCtx.tool.parameters.find((p) => p.key === testParameter.key);
    expect(originalParameter?.name).toBe("original-param");
    expect(originalParameter?.description).toBe("Original description");
    expect(originalParameter?.isRequired).toBe(false);
  });

  it("saves changes, closes dialog, and updates context with new values", () => {
    const testParameter = createTestParameter({
      name: "original-param",
      description: "Original description",
      isRequired: false,
      isGlobal: false,
      parameterType: "Option",
      dataType: "String",
    });
    const initState: Partial<ToolBuilderState> = {
      ...createTestState(testParameter),
    };
    initState.tool = { ...defaultTool("test-tool", "Test tool"), parameters: [testParameter] };

    renderWithProvider(initState);

    const nameInput = screen.getByDisplayValue("original-param");
    const descriptionTextarea = screen.getByDisplayValue("Original description");
    const requiredSwitch = screen.getByRole("switch", { name: /required/i });
    const globalSwitch = screen.getByRole("switch", { name: /global/i });

    act(() => {
      fireEvent.change(nameInput, { target: { value: "updated-param" } });
      fireEvent.change(descriptionTextarea, { target: { value: "Updated description" } });
      fireEvent.click(requiredSwitch);
      fireEvent.click(globalSwitch);
    });

    expect(screen.getByDisplayValue("updated-param")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Updated description")).toBeInTheDocument();
    expect(requiredSwitch).toBeChecked();
    expect(globalSwitch).toBeChecked();

    // Context should still have original values (not saved yet)
    expect(capturedCtx.selectedParameter?.name).toBe("original-param");
    expect(capturedCtx.selectedParameter?.isRequired).toBe(false);

    const saveButton = screen.getByRole("button", { name: "Save Changes" });
    expect(saveButton).not.toBeDisabled();

    act(() => {
      fireEvent.click(saveButton);
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(capturedCtx.selectedParameter).toBeNull();

    const updatedParameter = capturedCtx.tool.parameters.find((p) => p.name === "updated-param");
    expect(updatedParameter).toBeDefined();
    expect(updatedParameter?.name).toBe("updated-param");
    expect(updatedParameter?.description).toBe("Updated description");
    expect(updatedParameter?.isRequired).toBe(true);
    expect(updatedParameter?.isGlobal).toBe(true);
  });

  it("verifies context state is updated correctly after save", () => {
    const testParameter = createTestParameter();
    const initState: Partial<ToolBuilderState> = {
      ...createTestState(testParameter),
    };
    initState.tool = { ...defaultTool("test-tool", "Test tool"), parameters: [testParameter] };

    renderWithProvider(initState);

    const nameInput = screen.getByDisplayValue("test-param");
    act(() => {
      fireEvent.change(nameInput, { target: { value: "modified-param" } });
    });

    const saveButton = screen.getByRole("button", { name: "Save Changes" });
    act(() => {
      fireEvent.click(saveButton);
    });

    // After save: dialog closed, parameter updated in context
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(capturedCtx.selectedParameter).toBeNull();

    const updatedParameter = capturedCtx.tool.parameters.find((p) => p.name === "modified-param");
    expect(updatedParameter?.name).toBe("modified-param");
    expect(updatedParameter?.description).toBe("Test parameter description");
  });

  it("resets dialog state and preserves store when dialog is closed and reopened", () => {
    const testParameter = createTestParameter();
    const initState: Partial<ToolBuilderState> = {
      ...createTestState(testParameter),
    };
    initState.tool = { ...defaultTool("test-tool", "Test tool"), parameters: [testParameter] };

    const { unmount } = renderWithProvider(initState);

    const nameInput = screen.getByDisplayValue("test-param");

    act(() => {
      fireEvent.change(nameInput, { target: { value: "modified-param" } });
    });

    const saveButton = screen.getByRole("button", { name: "Save Changes" });
    expect(saveButton).not.toBeDisabled();

    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    act(() => {
      fireEvent.click(cancelButton);
    });

    unmount();

    // Re-render fresh with the same parameter
    const reopenState = { ...createTestState(testParameter) };
    reopenState.tool = { ...defaultTool("test-tool", "Test tool"), parameters: [testParameter] };
    renderWithProvider(reopenState);

    expect(screen.getByDisplayValue("test-param")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save Changes" })).toBeDisabled();
  });
});

describe("ParameterDetailsDialog - UI/UX", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("pre-fills all fields with selected parameter values", () => {
    const testParameter = createTestParameter({
      name: "test-parameter",
      parameterType: "Option",
      dataType: "String",
      longFlag: "--test-flag",
      shortFlag: "-t",
      description: "Test description",
      isRequired: true,
      isRepeatable: true,
      isGlobal: true,
      keyValueSeparator: "=",
      metadata: { tags: ["tag1", "tag2"] },
    });

    renderWithProvider(createTestState(testParameter));

    // Check all fields are pre-filled
    expect(screen.getByDisplayValue("test-parameter")).toBeInTheDocument();
    expect(screen.getByText("Option")).toBeInTheDocument();
    expect(screen.getByText("String")).toBeInTheDocument();
    expect(screen.getByDisplayValue("--test-flag")).toBeInTheDocument();
    expect(screen.getByDisplayValue("-t")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test description")).toBeInTheDocument();
    expect(screen.getByDisplayValue("=")).toBeInTheDocument();

    // Check switches
    const switches = screen.getAllByRole("switch");
    const requiredSwitch = switches.find((s) =>
      s.closest("div")?.textContent?.includes("Required"),
    );
    const repeatableSwitch = switches.find((s) =>
      s.closest("div")?.textContent?.includes("Repeatable"),
    );
    const globalSwitch = switches.find((s) => s.closest("div")?.textContent?.includes("Global"));

    expect(requiredSwitch).toBeChecked();
    expect(repeatableSwitch).toBeChecked();
    expect(globalSwitch).toBeChecked();

    // Confirm context matches
    expect(capturedCtx.selectedParameter?.name).toBe("test-parameter");
    expect(capturedCtx.selectedParameter?.isRequired).toBe(true);
    expect(capturedCtx.selectedParameter?.isGlobal).toBe(true);
  });

  it("displays correct parameter icon and global badge based on type and properties", () => {
    const globalParameter = createTestParameter({
      parameterType: "Flag",
      isGlobal: true,
    });

    renderWithProvider(createTestState(globalParameter));

    const dialogTitle = screen.getByText("test-param").closest("h2");
    expect(dialogTitle?.querySelector("svg")).toBeInTheDocument();
    expect(screen.getByText("global")).toBeInTheDocument();
  });

  it("updates context with parameter type changes after save", () => {
    const testParameter = createTestParameter({
      parameterType: "Option",
      keyValueSeparator: "=",
      longFlag: "--test",
      shortFlag: "-t",
    });
    const initState: Partial<ToolBuilderState> = {
      ...createTestState(testParameter),
    };
    initState.tool = { ...defaultTool("test-tool", "Test tool"), parameters: [testParameter] };

    renderWithProvider(initState);

    const selectElements = screen.getAllByRole("combobox");
    const parameterTypeSelect = selectElements[0];

    act(() => {
      fireEvent.click(parameterTypeSelect);
    });
    const flagOption = screen.getByRole("option", { name: "Flag" });
    act(() => {
      fireEvent.click(flagOption);
    });

    expect(screen.queryByText("Key-Value Separator")).not.toBeInTheDocument();

    const saveButton = screen.getByRole("button", { name: "Save Changes" });
    act(() => {
      fireEvent.click(saveButton);
    });

    const updatedParameter = capturedCtx.tool.parameters.find((p) => p.key === testParameter.key);
    expect(updatedParameter).toBeDefined();
    expect(updatedParameter?.parameterType).toBe("Flag");
    expect(updatedParameter?.longFlag).toBe("--test");
    expect(updatedParameter?.shortFlag).toBe("-t");
  });
});

describe("ParameterDetailsDialog - Enum Section", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows Add label for new parameters and Save Changes for existing ones", () => {
    const newParameter = createNewParameter(false, "test-command-key");
    renderWithProvider(createTestState(newParameter));

    expect(screen.queryByRole("button", { name: "Save Changes" })).not.toBeInTheDocument();
    // Submit button shows "Add" for new params; it's disabled since no name/longFlag yet
    // Dependencies and Validations sections also have "Add" buttons but those are enabled
    const addButtons = screen.getAllByRole("button", { name: "Add" });
    const submitAddButton = addButtons.find((btn) => btn.hasAttribute("disabled"));
    expect(submitAddButton).toBeDefined();
  });

  it("renders Value and Display Name column headers when enum values exist", () => {
    const testParameter = createTestParameter({
      dataType: "Enum",
      enum: {
        values: [{ value: "opt1", displayName: "Option 1", isDefault: false, sortOrder: 0 }],
        allowMultiple: false,
      },
    });

    renderWithProvider(createTestState(testParameter));

    expect(screen.getByText("Value")).toBeInTheDocument();
    expect(screen.getByText("Display Name")).toBeInTheDocument();
  });

  it("does not render column headers when there are no enum values", () => {
    const testParameter = createTestParameter({
      dataType: "Enum",
      enum: { values: [], allowMultiple: false },
    });

    renderWithProvider(createTestState(testParameter));

    expect(screen.queryByText("Value")).not.toBeInTheDocument();
    expect(screen.queryByText("Display Name")).not.toBeInTheDocument();
  });

  it("renders Default label next to each isDefault switch in enum rows", () => {
    const testParameter = createTestParameter({
      dataType: "Enum",
      enum: {
        values: [
          { value: "a", displayName: "A", isDefault: false, sortOrder: 0 },
          { value: "b", displayName: "B", isDefault: false, sortOrder: 1 },
        ],
        allowMultiple: false,
      },
    });

    renderWithProvider(createTestState(testParameter));

    const defaultLabels = screen.getAllByText("Default");
    // 1 invisible alignment spacer + 1 per enum row = 3 total
    expect(defaultLabels).toHaveLength(3);
  });

  it("makes isDefault selection mutually exclusive across enum value rows", () => {
    const testParameter = createTestParameter({
      dataType: "Enum",
      enum: {
        values: [
          { value: "one", displayName: "One", isDefault: true, sortOrder: 0 },
          { value: "two", displayName: "Two", isDefault: false, sortOrder: 1 },
        ],
        allowMultiple: false,
      },
    });
    const initState = { ...createTestState(testParameter) };
    initState.tool = { ...defaultTool("test-tool", "Test tool"), parameters: [testParameter] };

    renderWithProvider(initState);

    const defaultSwitches = screen
      .getAllByRole("switch")
      .filter((s) => s.closest("div")?.textContent?.trim() === "Default");

    expect(defaultSwitches).toHaveLength(2);
    expect(defaultSwitches[0]).toBeChecked();
    expect(defaultSwitches[1]).not.toBeChecked();

    act(() => {
      fireEvent.click(defaultSwitches[1]);
    });

    expect(defaultSwitches[0]).not.toBeChecked();
    expect(defaultSwitches[1]).toBeChecked();
  });

  it("shows Separator label when allowMultiple is enabled", () => {
    const testParameter = createTestParameter({
      dataType: "Enum",
      enum: {
        values: [{ value: "x", displayName: "X", isDefault: false, sortOrder: 0 }],
        allowMultiple: true,
        separator: ",",
      },
    });

    renderWithProvider(createTestState(testParameter));

    expect(screen.getByText("Separator")).toBeInTheDocument();
  });

  it("does not show Separator label when allowMultiple is disabled", () => {
    const testParameter = createTestParameter({
      dataType: "Enum",
      enum: {
        values: [{ value: "x", displayName: "X", isDefault: false, sortOrder: 0 }],
        allowMultiple: false,
      },
    });

    renderWithProvider(createTestState(testParameter));

    expect(screen.queryByText("Separator")).not.toBeInTheDocument();
  });

  it("blocks save when enum values list is empty", () => {
    const testParameter = createTestParameter({
      dataType: "Enum",
      enum: { values: [], allowMultiple: false },
    });
    const initState = { ...createTestState(testParameter) };
    initState.tool = { ...defaultTool("test-tool", "Test tool"), parameters: [testParameter] };

    renderWithProvider(initState);

    const saveButton = screen.getByRole("button", { name: "Save Changes" });
    const descriptionInput = screen.getByDisplayValue("Test parameter description");

    act(() => {
      fireEvent.change(descriptionInput, { target: { value: "Updated" } });
    });

    expect(saveButton).toBeDisabled();
  });

  it("blocks save when any enum value has an empty value string", () => {
    const testParameter = createTestParameter({
      dataType: "Enum",
      enum: {
        values: [{ value: "valid", displayName: "Valid", isDefault: false, sortOrder: 0 }],
        allowMultiple: false,
      },
    });
    const initState = { ...createTestState(testParameter) };
    initState.tool = { ...defaultTool("test-tool", "Test tool"), parameters: [testParameter] };

    renderWithProvider(initState);

    const saveButton = screen.getByRole("button", { name: "Save Changes" });

    const descriptionInput = screen.getByDisplayValue("Test parameter description");
    act(() => {
      fireEvent.change(descriptionInput, { target: { value: "Updated" } });
    });

    expect(saveButton).not.toBeDisabled();

    const valueInput = screen.getByDisplayValue("valid");
    act(() => {
      fireEvent.change(valueInput, { target: { value: "" } });
    });

    expect(saveButton).toBeDisabled();
  });
});


describe('ParameterDetailsDialog - Bug: Flag Update Duplication', () => {
  it('should update existing parameter when long flag is changed, not create a new one', async () => {
    const originalParam = createTestParameter({
      key: 'original-param',
      name: 'original-param',
      longFlag: '--original',
    });

    const initialState = createTestState(originalParam);
    if (initialState.tool) {
      initialState.tool.parameters = [originalParam];
    }

    renderWithProvider(initialState);

    const longFlagInput = screen.getByPlaceholderText("--verbose");
    const saveButton = screen.getByText("Save Changes");

    // Change the long flag - this will trigger slugify and change the 'key'
    act(() => {
      fireEvent.change(longFlagInput, { target: { value: '--updated' } });
    });

    // Save changes
    act(() => {
      fireEvent.click(saveButton);
    });

    // Check the final state in the tool via the captured context
    const parameters = capturedCtx.tool.parameters;
    
    // IT SHOULD STILL ONLY HAVE ONE PARAMETER, but the bug causes it to have 2
    // We expect 1 in a healthy system. This test should FAIL now (length will be 2) if fixed later.
    expect(parameters).toHaveLength(1);
    expect(parameters[0].longFlag).toBe('--updated');
    expect(parameters[0].key).toBe('updated');
  });
});
