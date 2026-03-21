import { ParameterDetailsDialog } from "@/components/tool-editor/dialogs/parameter-details-dialog";
import {
  ToolBuilderProvider,
  ToolBuilderState,
  useToolBuilder,
} from "@/components/tool-editor/tool-editor.context";
import { defaultTool } from "@/lib/utils";
import { Parameter, Command } from "@/registry/commandly/lib/types/commandly";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ReactNode } from "react";

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

describe("ParameterDetailsDialog - Dialog Lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("manages dialog open/close states and store synchronization", () => {
    const testParameter = createTestParameter();

    renderWithProvider(<ParameterDetailsDialog />, createTestState(testParameter));

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

    renderWithProvider(<ParameterDetailsDialog />, createTestState(testParameter));

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

    renderWithProvider(<ParameterDetailsDialog />, createTestState(testParameter));

    const selectElements = screen.getAllByRole("combobox");
    const parameterTypeSelect = selectElements[0];
    const dataTypeSelect = selectElements[1];

    // Change parameter type
    act(() => {
      fireEvent.click(parameterTypeSelect);
    });
    act(() => {
      fireEvent.click(screen.getByRole("option", { name: "Flag" }));
    });
    expect(screen.getByText("Flag")).toBeInTheDocument();

    // Change data type
    act(() => {
      fireEvent.click(dataTypeSelect);
    });
    act(() => {
      fireEvent.click(screen.getByRole("option", { name: "Boolean" }));
    });
    expect(screen.getByText("Boolean")).toBeInTheDocument();
  });

  it("handles switch toggles for boolean properties", () => {
    const testParameter = createTestParameter({
      isRequired: false,
      isGlobal: false,
      isRepeatable: false,
    });

    renderWithProvider(<ParameterDetailsDialog />, createTestState(testParameter));

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
    renderWithProvider(<ParameterDetailsDialog />, createTestState(testParameter));

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
    const flagParameter = createTestParameter({ parameterType: "Flag" });
    renderWithProvider(<ParameterDetailsDialog />, createTestState(flagParameter));

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

    renderWithProvider(<ParameterDetailsDialog />, createTestState(testParameter));

    const separatorInput = screen.getByDisplayValue("=");

    act(() => {
      fireEvent.change(separatorInput, { target: { value: ":" } });
    });

    expect(screen.getByDisplayValue(":")).toBeInTheDocument();
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

    renderWithProvider(<ParameterDetailsDialog />, initState);

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
    renderWithProvider(<ParameterDetailsDialog />, createTestState(testParameter));

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

  it("resets dialog state when new parameter is selected via context", () => {
    const firstParameter = createTestParameter({ name: "first-param" });
    const secondParameter = createTestParameter({
      key: "different-key",
      name: "second-param",
      commandKey: "test-command-key",
    });

    renderWithProvider(<ParameterDetailsDialog />, createTestState(firstParameter));

    const nameInput = screen.getByDisplayValue("first-param");

    act(() => {
      fireEvent.change(nameInput, { target: { value: "modified-first-param" } });
    });

    const saveButton = screen.getByRole("button", { name: "Save Changes" });
    expect(saveButton).not.toBeDisabled();

    act(() => {
      capturedCtx.setSelectedParameter(secondParameter);
    });

    expect(screen.getByDisplayValue("second-param")).toBeInTheDocument();
    expect(saveButton).toBeDisabled();

    expect(capturedCtx.selectedParameter?.name).toBe("second-param");
    expect(capturedCtx.selectedParameter?.key).toBe("different-key");
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

    renderWithProvider(<ParameterDetailsDialog />, initState);

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

    renderWithProvider(<ParameterDetailsDialog />, initState);

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

    renderWithProvider(<ParameterDetailsDialog />, initState);

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

    const { unmount } = renderWithProvider(<ParameterDetailsDialog />, initState);

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
    renderWithProvider(<ParameterDetailsDialog />, createTestState(testParameter));

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

    renderWithProvider(<ParameterDetailsDialog />, createTestState(testParameter));

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

    renderWithProvider(<ParameterDetailsDialog />, createTestState(globalParameter));

    const dialogTitle = screen.getByText("test-param").closest("h2");
    expect(dialogTitle?.querySelector("svg")).toBeInTheDocument();
    expect(screen.getByText("global")).toBeInTheDocument();

    // Switch to non-global parameter via context action
    const nonGlobalParameter = createTestParameter({ isGlobal: false });
    act(() => {
      capturedCtx.setSelectedParameter(nonGlobalParameter);
    });

    expect(screen.queryByText("global")).not.toBeInTheDocument();
    expect(capturedCtx.selectedParameter?.isGlobal).toBe(false);
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

    renderWithProvider(<ParameterDetailsDialog />, initState);

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
