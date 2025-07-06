import { render, screen, fireEvent, act } from "@testing-library/react";

import { defaultTool } from "@/registry/commandly/lib/utils/tool-editor";
import { Parameter, Command } from "@/registry/commandly/lib/types/tool-editor";
import { ParameterDetailsDialog } from "@/registry/commandly/tool-editor/dialogs/parameter-details-dialog";
import { ToolBuilderState, toolBuilderStore, toolBuilderActions } from "@/registry/commandly/tool-editor/tool-editor.store";

const createTestParameter = (
  overrides: Partial<Parameter> = {}
): Parameter => ({
  id: "01979f6d-f205-73e3-a176-4456d7bf7eb3",
  name: "test-param",
  commandId: "01979f6d-f205-73e3-a176-4456d7bf7eb4",
  description: "Test parameter description",
  parameterType: "Option",
  dataType: "String",
  isRequired: false,
  isRepeatable: false,
  isGlobal: false,
  longFlag: "--test",
  enumValues: [],
  ...overrides
});

const createTestCommand = (overrides: Partial<Command> = {}): Command => ({
  id: "01979f6d-f205-73e3-a176-4456d7bf7eb4",
  name: "test-command",
  description: "Test command description",
  isDefault: false,
  sortOrder: 0,
  ...overrides
});

const createTestState = (
  parameter: Parameter | null,
  toolName: string = "test-tool",
  command?: Command
): ToolBuilderState => ({
  tool: { ...defaultTool(toolName, "Test tool"), name: toolName },
  selectedCommand: command || createTestCommand(),
  selectedParameter: parameter,
  editingCommand: null,
  parameterValues: {},
  dialogs: {
    editTool: false,
    savedCommands: false,
    exclusionGroups: false,
    parameterDetails: false
  }
});

describe("ParameterDetailsDialog - Dialog Lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("manages dialog open/close states and store synchronization", () => {
    const testParameter = createTestParameter();

    // Opens when parameter is selected
    act(() => {
      toolBuilderStore.setState(createTestState(testParameter));
    });

    render(<ParameterDetailsDialog />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("test-param")).toBeInTheDocument();
    expect(toolBuilderStore.state.selectedParameter).toEqual(testParameter);

    // Closes when parameter is deselected
    act(() => {
      toolBuilderStore.setState(createTestState(null));
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(toolBuilderStore.state.selectedParameter).toBeNull();
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
      dataType: "String"
    });

    act(() => {
      toolBuilderStore.setState(createTestState(testParameter));
    });

    render(<ParameterDetailsDialog />);

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
      fireEvent.change(descriptionTextarea, {
        target: { value: "Updated description" }
      });
    });

    expect(screen.getByDisplayValue("updated-param")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Updated description")).toBeInTheDocument();
  });

  it("handles parameter type and data type changes", () => {
    const testParameter = createTestParameter({
      parameterType: "Option",
      dataType: "String"
    });

    act(() => {
      toolBuilderStore.setState(createTestState(testParameter));
    });

    render(<ParameterDetailsDialog />);

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
      isRepeatable: false
    });

    act(() => {
      toolBuilderStore.setState(createTestState(testParameter));
    });

    render(<ParameterDetailsDialog />);

    const switches = screen.getAllByRole("switch");
    const requiredSwitch = switches.find((s) =>
      s.closest("div")?.textContent?.includes("Required")
    );
    const globalSwitch = switches.find((s) =>
      s.closest("div")?.textContent?.includes("Global")
    );
    const repeatableSwitch = switches.find((s) =>
      s.closest("div")?.textContent?.includes("Repeatable")
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

    act(() => {
      toolBuilderStore.setState(createTestState(testParameter));
    });

    render(<ParameterDetailsDialog />);

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

    act(() => {
      toolBuilderStore.setState(createTestState(flagParameter));
    });

    render(<ParameterDetailsDialog />);

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
    expect(
      screen.queryByText("Short Flag (include prefix)")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Long Flag (include prefix)")
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Key-Value Separator")).not.toBeInTheDocument();
  });

  it("updates Key-Value Separator when changed", () => {
    const testParameter = createTestParameter({
      parameterType: "Option",
      keyValueSeparator: "="
    });

    act(() => {
      toolBuilderStore.setState(createTestState(testParameter));
    });

    render(<ParameterDetailsDialog />);

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
    const testState = createTestState(testParameter);
    // No other parameters available
    testState.tool.parameters = [testParameter];

    act(() => {
      toolBuilderStore.setState(testState);
    });

    render(<ParameterDetailsDialog />);

    const addButtons = screen.getAllByRole("button", { name: "Add" });
    const dependenciesAddButton = addButtons[0]; // First Add button is for dependencies

    expect(dependenciesAddButton).toBeDisabled();

    // Assert store state - should only have the single parameter
    const state = toolBuilderStore.state;
    expect(state.tool.parameters).toHaveLength(1);
    expect(state.tool.parameters[0]).toEqual(testParameter);
  });
});

describe("ParameterDetailsDialog - State Management & Dialog Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("enables save button when changes are made but keeps store unchanged until saved", () => {
    const testParameter = createTestParameter();

    act(() => {
      toolBuilderStore.setState(createTestState(testParameter));
    });

    render(<ParameterDetailsDialog />);

    const saveButton = screen.getByRole("button", { name: "Save Changes" });
    expect(saveButton).toBeDisabled();

    const nameInput = screen.getByDisplayValue("test-param");

    act(() => {
      fireEvent.change(nameInput, { target: { value: "updated-param" } });
    });

    expect(saveButton).not.toBeDisabled();

    const state = toolBuilderStore.state;
    expect(state.selectedParameter?.name).toBe("test-param");
  });

  it("resets dialog state and updates store when new parameter is selected", () => {
    const firstParameter = createTestParameter({ name: "first-param" });
    const secondParameter = createTestParameter({
      id: "different-id",
      name: "second-param"
    });

    act(() => {
      toolBuilderStore.setState(createTestState(firstParameter));
    });

    render(<ParameterDetailsDialog />);

    const nameInput = screen.getByDisplayValue("first-param");

    act(() => {
      fireEvent.change(nameInput, {
        target: { value: "modified-first-param" }
      });
    });

    const saveButton = screen.getByRole("button", { name: "Save Changes" });
    expect(saveButton).not.toBeDisabled();

    act(() => {
      toolBuilderStore.setState(createTestState(secondParameter));
    });

    expect(screen.getByDisplayValue("second-param")).toBeInTheDocument();
    expect(saveButton).toBeDisabled();

    const state = toolBuilderStore.state;
    expect(state.selectedParameter?.name).toBe("second-param");
    expect(state.selectedParameter?.id).toBe("different-id");
  });

  it("cancels changes, closes dialog, and preserves original store state", () => {
    const testParameter = createTestParameter({
      name: "original-param",
      description: "Original description",
      isRequired: false
    });

    const testState = createTestState(testParameter);
    testState.tool.parameters = [testParameter];

    act(() => {
      toolBuilderStore.setState(testState);
    });

    render(<ParameterDetailsDialog />);

    const nameInput = screen.getByDisplayValue("original-param");
    const descriptionTextarea = screen.getByDisplayValue(
      "Original description"
    );

    act(() => {
      fireEvent.change(nameInput, { target: { value: "modified-param" } });
      fireEvent.change(descriptionTextarea, {
        target: { value: "Modified description" }
      });
    });

    expect(screen.getByDisplayValue("modified-param")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("Modified description")
    ).toBeInTheDocument();

    const cancelButton = screen.getByRole("button", { name: "Cancel" });

    act(() => {
      fireEvent.click(cancelButton);
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    const state = toolBuilderStore.state;
    expect(state.selectedParameter).toBeNull();

    const originalParameter = state.tool.parameters.find(
      (p) => p.id === testParameter.id
    );
    expect(originalParameter).toBeDefined();
    expect(originalParameter?.name).toBe("original-param");
    expect(originalParameter?.description).toBe("Original description");
    expect(originalParameter?.isRequired).toBe(false);
  });

  it("saves changes, closes dialog, and updates store with new values", () => {
    const testParameter = createTestParameter({
      name: "original-param",
      description: "Original description",
      isRequired: false,
      isGlobal: false,
      parameterType: "Option",
      dataType: "String"
    });

    const testState = createTestState(testParameter);
    testState.tool.parameters = [testParameter];

    act(() => {
      toolBuilderStore.setState(testState);
    });

    render(<ParameterDetailsDialog />);

    const nameInput = screen.getByDisplayValue("original-param");
    const descriptionTextarea = screen.getByDisplayValue(
      "Original description"
    );
    const requiredSwitch = screen.getByRole("switch", { name: /required/i });
    const globalSwitch = screen.getByRole("switch", { name: /global/i });

    act(() => {
      fireEvent.change(nameInput, { target: { value: "updated-param" } });
      fireEvent.change(descriptionTextarea, {
        target: { value: "Updated description" }
      });
      fireEvent.click(requiredSwitch);
      fireEvent.click(globalSwitch);
    });

    expect(screen.getByDisplayValue("updated-param")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Updated description")).toBeInTheDocument();
    expect(requiredSwitch).toBeChecked();
    expect(globalSwitch).toBeChecked();

    let state = toolBuilderStore.state;
    expect(state.selectedParameter?.name).toBe("original-param");
    expect(state.selectedParameter?.description).toBe("Original description");
    expect(state.selectedParameter?.isRequired).toBe(false);
    expect(state.selectedParameter?.isGlobal).toBe(false);

    const saveButton = screen.getByRole("button", { name: "Save Changes" });
    expect(saveButton).not.toBeDisabled();

    act(() => {
      fireEvent.click(saveButton);
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    state = toolBuilderStore.state;
    expect(state.selectedParameter).toBeNull();

    const updatedParameter = state.tool.parameters.find(
      (p) => p.id === testParameter.id
    );
    expect(updatedParameter).toBeDefined();
    expect(updatedParameter?.name).toBe("updated-param");
    expect(updatedParameter?.description).toBe("Updated description");
    expect(updatedParameter?.isRequired).toBe(true);
    expect(updatedParameter?.isGlobal).toBe(true);
  });

  it("verifies store actions are called correctly during save and cancel operations", () => {
    const setSelectedParameterSpy = vi.spyOn(
      toolBuilderActions,
      "setSelectedParameter"
    );
    const upsertParameterSpy = vi.spyOn(toolBuilderActions, "upsertParameter");

    const testParameter = createTestParameter();
    const testState = createTestState(testParameter);
    testState.tool.parameters = [testParameter];

    act(() => {
      toolBuilderStore.setState(testState);
    });

    render(<ParameterDetailsDialog />);

    const nameInput = screen.getByDisplayValue("test-param");
    act(() => {
      fireEvent.change(nameInput, { target: { value: "modified-param" } });
    });

    const saveButton = screen.getByRole("button", { name: "Save Changes" });
    act(() => {
      fireEvent.click(saveButton);
    });

    expect(upsertParameterSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        ...testParameter,
        name: "modified-param"
      })
    );
    expect(setSelectedParameterSpy).toHaveBeenCalledWith(null);

    const finalState = toolBuilderStore.state;
    expect(finalState.selectedParameter).toBeNull();
    const updatedParameter = finalState.tool.parameters.find(
      (p) => p.id === testParameter.id
    );
    expect(updatedParameter?.name).toBe("modified-param");

    setSelectedParameterSpy.mockRestore();
    upsertParameterSpy.mockRestore();
  });

  it("resets dialog state and preserves store when dialog is closed and reopened", () => {
    const testParameter = createTestParameter();

    act(() => {
      toolBuilderStore.setState(createTestState(testParameter));
    });

    const { unmount } = render(<ParameterDetailsDialog />);

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

    act(() => {
      toolBuilderStore.setState(createTestState(testParameter));
    });

    render(<ParameterDetailsDialog />);

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
      defaultValue: "default-value",
      isRequired: true,
      isRepeatable: true,
      isGlobal: true,
      keyValueSeparator: "=",
      metadata: { tags: ["tag1", "tag2"] }
    });

    act(() => {
      toolBuilderStore.setState(createTestState(testParameter));
    });

    render(<ParameterDetailsDialog />);

    // Check all fields are pre-filled
    expect(screen.getByDisplayValue("test-parameter")).toBeInTheDocument();
    expect(screen.getByText("Option")).toBeInTheDocument();
    expect(screen.getByText("String")).toBeInTheDocument();
    expect(screen.getByDisplayValue("--test-flag")).toBeInTheDocument();
    expect(screen.getByDisplayValue("-t")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test description")).toBeInTheDocument();
    expect(screen.getByDisplayValue("default-value")).toBeInTheDocument();
    expect(screen.getByDisplayValue("=")).toBeInTheDocument();

    // Check switches
    const switches = screen.getAllByRole("switch");
    const requiredSwitch = switches.find((s) =>
      s.closest("div")?.textContent?.includes("Required")
    );
    const repeatableSwitch = switches.find((s) =>
      s.closest("div")?.textContent?.includes("Repeatable")
    );
    const globalSwitch = switches.find((s) =>
      s.closest("div")?.textContent?.includes("Global")
    );

    expect(requiredSwitch).toBeChecked();
    expect(repeatableSwitch).toBeChecked();
    expect(globalSwitch).toBeChecked();

    // Assert store state matches pre-filled values
    const state = toolBuilderStore.state;
    expect(state.selectedParameter?.name).toBe("test-parameter");
    expect(state.selectedParameter?.parameterType).toBe("Option");
    expect(state.selectedParameter?.dataType).toBe("String");
    expect(state.selectedParameter?.longFlag).toBe("--test-flag");
    expect(state.selectedParameter?.shortFlag).toBe("-t");
    expect(state.selectedParameter?.description).toBe("Test description");
    expect(state.selectedParameter?.defaultValue).toBe("default-value");
    expect(state.selectedParameter?.isRequired).toBe(true);
    expect(state.selectedParameter?.isRepeatable).toBe(true);
    expect(state.selectedParameter?.isGlobal).toBe(true);
    expect(state.selectedParameter?.keyValueSeparator).toBe("=");
  });

  it("displays correct parameter icon and global badge based on type and properties", () => {
    const globalParameter = createTestParameter({
      parameterType: "Flag",
      isGlobal: true
    });

    act(() => {
      toolBuilderStore.setState(createTestState(globalParameter));
    });

    render(<ParameterDetailsDialog />);

    const dialogTitle = screen.getByText("test-param").closest("h2");
    expect(dialogTitle?.querySelector("svg")).toBeInTheDocument();

    expect(screen.getByText("global")).toBeInTheDocument();

    const nonGlobalParameter = createTestParameter({ isGlobal: false });

    act(() => {
      toolBuilderStore.setState(createTestState(nonGlobalParameter));
    });

    expect(screen.queryByText("global")).not.toBeInTheDocument();

    const state = toolBuilderStore.state;
    expect(state.selectedParameter?.isGlobal).toBe(false);
  });

  it("updates store with parameter type changes and related field updates", () => {
    const testParameter = createTestParameter({
      parameterType: "Option",
      keyValueSeparator: "=",
      longFlag: "--test",
      shortFlag: "-t"
    });

    const testState = createTestState(testParameter);
    testState.tool.parameters = [testParameter];

    act(() => {
      toolBuilderStore.setState(testState);
    });

    render(<ParameterDetailsDialog />);

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

    const state = toolBuilderStore.state;
    const updatedParameter = state.tool.parameters.find(
      (p) => p.id === testParameter.id
    );
    expect(updatedParameter).toBeDefined();
    expect(updatedParameter?.parameterType).toBe("Flag");
    expect(updatedParameter?.longFlag).toBe("--test");
    expect(updatedParameter?.shortFlag).toBe("-t");
  });
});
