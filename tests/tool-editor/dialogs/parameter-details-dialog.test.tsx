import { createTestCommand, createTestParameter, defaultTool } from "../../test-utils";
import {
  capturedCtx,
  createTestState,
  renderWithProvider,
} from "./parameter-details-dialog.harness";
import { getCommandParameters } from "@/components/commandly/utils/tool";
import { ToolBuilderState } from "@/components/tool-editor/tool-editor.context";
import { act, fireEvent, screen } from "@testing-library/react";

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
      displayName: "my-parameter",
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

    // Switch to Flag - dataType is auto-set to Boolean, only Boolean is in the list
    act(() => {
      fireEvent.click(parameterTypeSelect);
    });
    act(() => {
      fireEvent.click(screen.getByRole("option", { name: "Flag" }));
    });
    expect(screen.getByText("Flag")).toBeInTheDocument();
    expect(screen.getByText("Boolean")).toBeInTheDocument();

    // Switch back to Option - change data type to Enum
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
      recursive: false,
      isRepeatable: false,
    });

    renderWithProvider(createTestState(testParameter));

    const switches = screen.getAllByRole("switch");
    const requiredSwitch = switches.find((s) =>
      s.closest("div")?.textContent?.includes("Required"),
    );
    const recursiveSwitch = switches.find((s) =>
      s.closest("div")?.textContent?.includes("Inherited by subcommands"),
    );
    const repeatableSwitch = switches.find((s) =>
      s.closest("div")?.textContent?.includes("Repeatable"),
    );

    // Initial state
    expect(requiredSwitch).not.toBeChecked();
    expect(recursiveSwitch).not.toBeChecked();
    expect(repeatableSwitch).not.toBeChecked();

    // Toggle switches
    act(() => {
      fireEvent.click(requiredSwitch!);
      fireEvent.click(recursiveSwitch!);
      fireEvent.click(repeatableSwitch!);
    });

    expect(requiredSwitch).toBeChecked();
    expect(recursiveSwitch).toBeChecked();
    expect(repeatableSwitch).toBeChecked();
  });

  it("validates empty parameter name", () => {
    const testParameter = createTestParameter();
    const initState = { ...createTestState(testParameter) };
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

    const aliasesLabel = /Short names and other aliases/;

    // Flag type shows alias fields but not key-value separator
    expect(screen.getByText(aliasesLabel)).toBeInTheDocument();
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
    expect(screen.getByText(aliasesLabel)).toBeInTheDocument();
    expect(screen.getByText("Key-Value Separator")).toBeInTheDocument();

    // Switch to Argument type
    act(() => {
      fireEvent.click(parameterTypeSelect);
    });
    act(() => {
      fireEvent.click(screen.getByRole("option", { name: "Argument" }));
    });

    // Argument type hides alias fields
    expect(screen.queryByText(aliasesLabel)).not.toBeInTheDocument();
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
    act(() => {
      fireEvent.click(parameterTypeSelect);
    });
    act(() => {
      fireEvent.click(screen.getByRole("option", { name: "Flag" }));
    });
    expect(screen.getByText("Boolean")).toBeInTheDocument();

    // Flag → Option: dataType resets to String, all data type options available
    act(() => {
      fireEvent.click(parameterTypeSelect);
    });
    act(() => {
      fireEvent.click(screen.getByRole("option", { name: "Option" }));
    });
    expect(screen.getByText("String")).toBeInTheDocument();

    // Option → Flag again: dataType auto-set to Boolean
    act(() => {
      fireEvent.click(parameterTypeSelect);
    });
    act(() => {
      fireEvent.click(screen.getByRole("option", { name: "Flag" }));
    });
    expect(screen.getByText("Boolean")).toBeInTheDocument();

    // Flag → Argument: dataType resets to String, all data type options available
    act(() => {
      fireEvent.click(parameterTypeSelect);
    });
    act(() => {
      fireEvent.click(screen.getByRole("option", { name: "Argument" }));
    });
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
    // Only this parameter - no others available

    renderWithProvider(initState);

    const addButtons = screen.getAllByRole("button", { name: "Add" });
    const dependenciesAddButton = addButtons[0];

    expect(dependenciesAddButton).toBeDisabled();
    expect(getCommandParameters(capturedCtx.tool, "test-command-key")).toHaveLength(1);
    expect(getCommandParameters(capturedCtx.tool, "test-command-key")[0]).toEqual(testParameter);
  });

  it("keeps a newly added dependency when its target parameter is picked", () => {
    const testParameter = createTestParameter();
    const otherParameters = [
      createTestParameter({
        key: "other-param-key",
        displayName: "other-param",
        aliases: ["--other"],
      }),
      createTestParameter({
        key: "second-param-key",
        displayName: "second-param",
        aliases: ["--second"],
      }),
    ];
    const initState = createTestState(testParameter, "test-tool", {
      ...createTestCommand(),
      parameters: otherParameters,
    });

    renderWithProvider(initState);

    const dependenciesAddButton = screen.getAllByRole("button", { name: "Add" })[0];
    expect(dependenciesAddButton).not.toBeDisabled();

    act(() => {
      fireEvent.click(dependenciesAddButton);
    });

    const comboboxCount = screen.getAllByRole("combobox").length;
    expect(comboboxCount).toBeGreaterThan(2);

    const dependsOnSelect = screen.getAllByRole("combobox")[comboboxCount - 1];
    act(() => {
      fireEvent.click(dependsOnSelect);
    });
    act(() => {
      fireEvent.click(screen.getByRole("option", { name: "second-param" }));
    });

    expect(screen.getAllByRole("combobox")).toHaveLength(comboboxCount);
    expect(screen.getByText("second-param")).toBeInTheDocument();
  });
});

describe("ParameterDetailsDialog - State Management & Dialog Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("enables save button when changes are made but keeps store unchanged until saved", () => {
    const testParameter = createTestParameter();
    const initState = { ...createTestState(testParameter) };
    renderWithProvider(initState);

    const saveButton = screen.getByRole("button", { name: "Save Changes" });
    expect(saveButton).toBeDisabled();

    const nameInput = screen.getByDisplayValue("test-param");

    act(() => {
      fireEvent.change(nameInput, { target: { value: "updated-param" } });
    });

    expect(saveButton).not.toBeDisabled();
    // Context selectedParameter should still have the original name (not yet saved)
    expect(capturedCtx.selectedParameter?.displayName).toBe("test-param");
  });

  it("cancels changes, closes dialog, and preserves original store state", () => {
    const testParameter = createTestParameter({
      displayName: "original-param",
      description: "Original description",
      isRequired: false,
    });
    const initState: Partial<ToolBuilderState> = {
      ...createTestState(testParameter),
    };

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

    const originalParameter = getCommandParameters(capturedCtx.tool, "test-command-key").find(
      (p) => p.key === testParameter.key,
    );
    expect(originalParameter?.displayName).toBe("original-param");
    expect(originalParameter?.description).toBe("Original description");
    expect(originalParameter?.isRequired).toBe(false);
  });

  it("saves changes, closes dialog, and updates context with new values", () => {
    const testParameter = createTestParameter({
      displayName: "original-param",
      description: "Original description",
      isRequired: false,
      recursive: false,
      parameterType: "Option",
      dataType: "String",
    });
    const initState: Partial<ToolBuilderState> = {
      ...createTestState(testParameter),
    };

    renderWithProvider(initState);

    const nameInput = screen.getByDisplayValue("original-param");
    const descriptionTextarea = screen.getByDisplayValue("Original description");
    const requiredSwitch = screen.getByRole("switch", { name: /required/i });
    const recursiveSwitch = screen.getByRole("switch", { name: /inherited by subcommands/i });

    act(() => {
      fireEvent.change(nameInput, { target: { value: "updated-param" } });
      fireEvent.change(descriptionTextarea, { target: { value: "Updated description" } });
      fireEvent.click(requiredSwitch);
      fireEvent.click(recursiveSwitch);
    });

    expect(screen.getByDisplayValue("updated-param")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Updated description")).toBeInTheDocument();
    expect(requiredSwitch).toBeChecked();
    expect(recursiveSwitch).toBeChecked();

    // Context should still have original values (not saved yet)
    expect(capturedCtx.selectedParameter?.displayName).toBe("original-param");
    expect(capturedCtx.selectedParameter?.isRequired).toBe(false);

    const saveButton = screen.getByRole("button", { name: "Save Changes" });
    expect(saveButton).not.toBeDisabled();

    act(() => {
      fireEvent.click(saveButton);
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(capturedCtx.selectedParameter).toBeNull();

    const updatedParameter = getCommandParameters(capturedCtx.tool, "test-command-key").find(
      (p) => p.displayName === "updated-param",
    );
    expect(updatedParameter).toBeDefined();
    expect(updatedParameter?.displayName).toBe("updated-param");
    expect(updatedParameter?.description).toBe("Updated description");
    expect(updatedParameter?.isRequired).toBe(true);
    expect(updatedParameter?.recursive).toBe(true);
  });

  it("verifies context state is updated correctly after save", () => {
    const testParameter = createTestParameter();
    const initState: Partial<ToolBuilderState> = {
      ...createTestState(testParameter),
    };

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

    const updatedParameter = getCommandParameters(capturedCtx.tool, "test-command-key").find(
      (p) => p.displayName === "modified-param",
    );
    expect(updatedParameter?.displayName).toBe("modified-param");
    expect(updatedParameter?.description).toBe("Test parameter description");
  });

  it("resets dialog state and preserves store when dialog is closed and reopened", () => {
    const testParameter = createTestParameter();
    const initState: Partial<ToolBuilderState> = {
      ...createTestState(testParameter),
    };

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
      displayName: "test-parameter",
      parameterType: "Option",
      dataType: "String",
      aliases: ["-t", "--test-flag"],
      description: "Test description",
      isRequired: true,
      isRepeatable: true,
      recursive: true,
      keyValueSeparator: "=",
      metadata: { tags: ["tag1", "tag2"] },
    });

    renderWithProvider(createTestState(testParameter));

    // Check all fields are pre-filled
    expect(screen.getByDisplayValue("test-parameter")).toBeInTheDocument();
    expect(screen.getByText("Option")).toBeInTheDocument();
    expect(screen.getByText("String")).toBeInTheDocument();
    expect(screen.getByText("--test-flag")).toBeInTheDocument();
    expect(screen.getByText("-t")).toBeInTheDocument();
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
    const recursiveSwitch = switches.find((s) =>
      s.closest("div")?.textContent?.includes("Inherited by subcommands"),
    );

    expect(requiredSwitch).toBeChecked();
    expect(repeatableSwitch).toBeChecked();
    expect(recursiveSwitch).toBeChecked();

    // Confirm context matches
    expect(capturedCtx.selectedParameter?.displayName).toBe("test-parameter");
    expect(capturedCtx.selectedParameter?.isRequired).toBe(true);
    expect(capturedCtx.selectedParameter?.recursive).toBe(true);
  });

  it("displays correct parameter icon and root badge based on type and properties", () => {
    const rootParameter = createTestParameter({
      parameterType: "Flag",
    });

    renderWithProvider({
      tool: { ...defaultTool("test-tool", "Test tool"), parameters: [rootParameter] },
      selectedCommandKey: null,
      selectedParameter: rootParameter,
    });

    const dialogTitle = screen.getByText("test-param").closest("h2");
    expect(dialogTitle?.querySelector("svg")).toBeInTheDocument();
    expect(screen.getByText("root")).toBeInTheDocument();
  });

  it("updates context with parameter type changes after save", () => {
    const testParameter = createTestParameter({
      parameterType: "Option",
      keyValueSeparator: "=",
      aliases: ["-t", "--test"],
    });
    const initState: Partial<ToolBuilderState> = {
      ...createTestState(testParameter),
    };

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

    const updatedParameter = getCommandParameters(capturedCtx.tool, "test-command-key").find(
      (p) => p.key === testParameter.key,
    );
    expect(updatedParameter).toBeDefined();
    expect(updatedParameter?.parameterType).toBe("Flag");
    expect(updatedParameter?.aliases).toEqual(["-t", "--test"]);
  });
});

describe("ParameterDetailsDialog - Parameter Key Stability", () => {
  it("keeps the parameter key when only its aliases change", async () => {
    const originalParam = createTestParameter({
      key: "output",
      displayName: "Output",
      aliases: ["-o"],
    });

    const initialState = createTestState(originalParam);

    renderWithProvider(initialState);

    const aliasInput = screen.getByPlaceholderText("Add short names, e.g. -o");
    const saveButton = screen.getByText("Save Changes");

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Remove -o option" }));
    });
    act(() => {
      fireEvent.change(aliasInput, { target: { value: "--output-file" } });
      fireEvent.keyDown(aliasInput, { key: "Enter" });
    });

    act(() => {
      fireEvent.click(saveButton);
    });

    const parameters = getCommandParameters(capturedCtx.tool, "test-command-key");

    expect(parameters).toHaveLength(1);
    expect(parameters[0].aliases).toEqual(["--output-file"]);
    expect(parameters[0].key).toBe("output");
  });

  it("saves the authored key independently of the display name", async () => {
    const originalParam = createTestParameter({
      key: "output",
      displayName: "Output File",
      aliases: ["-o"],
    });

    const initialState = createTestState(originalParam);

    renderWithProvider(initialState);

    const nameInput = screen.getByDisplayValue("Output File");
    const keyInput = screen.getByDisplayValue("output");
    act(() => {
      fireEvent.change(nameInput, { target: { value: "Destination" } });
      fireEvent.change(keyInput, { target: { value: "--destination" } });
    });

    act(() => {
      fireEvent.click(screen.getByText("Save Changes"));
    });

    const parameters = getCommandParameters(capturedCtx.tool, "test-command-key");
    expect(parameters).toHaveLength(1);
    expect(parameters[0].displayName).toBe("Destination");
    expect(parameters[0].key).toBe("--destination");
  });

  it("renaming only the display name leaves the key untouched", async () => {
    const originalParam = createTestParameter({
      key: "output",
      displayName: "Output File",
      aliases: ["-o"],
    });

    const initialState = createTestState(originalParam);

    renderWithProvider(initialState);

    const nameInput = screen.getByDisplayValue("Output File");
    act(() => {
      fireEvent.change(nameInput, { target: { value: "Destination" } });
    });

    act(() => {
      fireEvent.click(screen.getByText("Save Changes"));
    });

    const parameters = getCommandParameters(capturedCtx.tool, "test-command-key");
    expect(parameters).toHaveLength(1);
    expect(parameters[0].displayName).toBe("Destination");
    expect(parameters[0].key).toBe("output");
  });

  it("disables save when the key collides with a sibling parameter", () => {
    const testParameter = createTestParameter({ key: "--output", displayName: "Output" });
    const sibling = createTestParameter({
      key: "--verbose",
      displayName: "Verbose",
      aliases: [],
    });

    renderWithProvider(
      createTestState(testParameter, "test-tool", {
        ...createTestCommand(),
        parameters: [sibling],
      }),
    );

    const keyInput = screen.getByDisplayValue("--output");
    act(() => {
      fireEvent.change(keyInput, { target: { value: "--verbose" } });
    });

    expect(screen.getByRole("button", { name: "Save Changes" })).toBeDisabled();
  });
});
