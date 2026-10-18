import { createTestParameter } from "../../test-utils";
import { createTestState, renderWithProvider } from "./parameter-details-dialog.harness";
import { Parameter } from "@/components/commandly/types/tool";
import { act, fireEvent, screen } from "@testing-library/react";

describe("ParameterDetailsDialog - Enum Section", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows Add label for new parameters and Save Changes for existing ones", () => {
    const newParameter: Parameter = {
      key: "",
      displayName: "",
      parameterType: "Option",
      dataType: "String",
      aliases: [],
    };
    renderWithProvider(createTestState(newParameter));

    expect(screen.queryByRole("button", { name: "Save Changes" })).not.toBeInTheDocument();
    // Submit button shows "Add" for new params; it's disabled since no name/alias yet
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

    expect(screen.getByText("Value", { selector: "span" })).toBeInTheDocument();
    expect(screen.getByText("Display Name", { selector: "span" })).toBeInTheDocument();
  });

  it("does not render column headers when there are no enum values", () => {
    const testParameter = createTestParameter({
      dataType: "Enum",
      enum: { values: [], allowMultiple: false },
    });

    renderWithProvider(createTestState(testParameter));

    expect(screen.queryByText("Value", { selector: "span" })).not.toBeInTheDocument();
    expect(screen.queryByText("Display Name", { selector: "span" })).not.toBeInTheDocument();
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
