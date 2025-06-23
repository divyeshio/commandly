import { render, screen, fireEvent } from "@testing-library/react";
import { ParameterList } from "@/components/tool-editor-ui/parameter-list";
import {
  ToolBuilderState,
  toolBuilderStore,
} from "@/components/tool-editor-ui/tool-editor.store";
import { defaultTool } from "@/lib/utils/tool-editor";
import { Parameter, ExclusionGroup } from "@/lib/types/tool-editor";

const createTestParameter = (
  overrides: Partial<Parameter> = {}
): Parameter => ({
  id: "param1",
  name: "test-param",
  description: "Test parameter",
  parameterType: "Option",
  dataType: "String",
  isRequired: false,
  isRepeatable: false,
  isGlobal: false,
  longFlag: "--test",
  shortFlag: "-t",
  enumValues: [],
  command: "test-command",
  ...overrides,
});

const createTestExclusionGroup = (
  parameterIds: string[] = []
): ExclusionGroup => ({
  id: "group1",
  name: "Test Group",
  exclusionType: "mutual_exclusive",
  parameterIds,
});

var testState: ToolBuilderState = {
  tool: defaultTool("test-tool", "Test tool"),
  selectedCommand: {
    name: "test-command",
    description: "Test command",
    isDefault: false,
    sortOrder: 0,
    subcommands: [],
  },
  selectedParameter: null,
  editingCommand: null,
  parameterValues: {},
  dialogs: {
    editTool: false,
    savedCommands: false,
    exclusionGroups: false,
  },
};

describe("ParameterList - Rendering & Structure", () => {
  beforeEach(() => {
    toolBuilderStore.setState((prev) => {
      return { ...prev, ...testState };
    });
  });

  it("renders the title and parameter count correctly", () => {
    const parameters = [
      createTestParameter(),
      createTestParameter({ id: "param2", name: "param2" }),
    ];
    toolBuilderStore.setState((prev) => ({
      ...prev,
      tool: { ...prev.tool, parameters },
    }));

    render(<ParameterList title="Test Parameters" />);
    expect(screen.getByText("Test Parameters (2)")).toBeInTheDocument();
  });

  it("renders the globe icon when isGlobal is true", () => {
    const globalParam = createTestParameter({ isGlobal: true });
    toolBuilderStore.setState((prev) => ({
      ...prev,
      tool: { ...prev.tool, parameters: [globalParam] },
    }));

    render(<ParameterList title="Global Parameters" isGlobal />);
    expect(screen.getByText("Global Parameters (1)")).toBeInTheDocument();

    const heading = screen.getByRole("heading", { level: 3 });
    expect(heading.querySelector("svg")).toBeInTheDocument();
  });

  it("renders the add button and triggers the correct action on click", () => {
    render(<ParameterList title="Parameters" />);

    const addButton = screen.getByRole("button");
    expect(addButton).toBeInTheDocument();
    expect(addButton.querySelector("svg")).toBeInTheDocument();

    fireEvent.click(addButton);
  });

  it("renders the correct number of parameter cards based on the parameters array", () => {
    const parameters = [
      createTestParameter({ id: "param1", name: "param1" }),
      createTestParameter({ id: "param2", name: "param2" }),
      createTestParameter({ id: "param3", name: "param3" }),
    ];
    toolBuilderStore.setState((prev) => ({
      ...prev,
      tool: { ...prev.tool, parameters },
    }));

    render(<ParameterList title="Parameters" />);

    expect(screen.getByText("param1")).toBeInTheDocument();
    expect(screen.getByText("param2")).toBeInTheDocument();
    expect(screen.getByText("param3")).toBeInTheDocument();
  });

  describe("Parameter Card Display", () => {
    it("displays the correct icon for each parameterType", () => {
      const parameters = [
        createTestParameter({
          id: "flag",
          name: "flag-param",
          parameterType: "Flag",
        }),
        createTestParameter({
          id: "option",
          name: "option-param",
          parameterType: "Option",
        }),
        createTestParameter({
          id: "argument",
          name: "argument-param",
          parameterType: "Argument",
        }),
      ];
      toolBuilderStore.setState((prev) => ({
        ...prev,
        tool: { ...prev.tool, parameters },
      }));

      render(<ParameterList title="Parameters" />);

      const flagCard = screen.getByText("flag-param").closest("div");
      const optionCard = screen.getByText("option-param").closest("div");
      const argumentCard = screen.getByText("argument-param").closest("div");

      expect(flagCard?.querySelector("svg")).toBeInTheDocument();
      expect(optionCard?.querySelector("svg")).toBeInTheDocument();
      expect(argumentCard?.querySelector("svg")).toBeInTheDocument();
    });

    it("shows parameter name and flags if present", () => {
      const paramWithBothFlags = createTestParameter({
        name: "test-param",
        longFlag: "--verbose",
        shortFlag: "-v",
      });
      const paramWithLongFlagOnly = createTestParameter({
        id: "param2",
        name: "long-only",
        longFlag: "--long-only",
        shortFlag: "",
      });
      const paramWithNoFlags = createTestParameter({
        id: "param3",
        name: "no-flags",
        longFlag: "",
        shortFlag: "",
      });

      toolBuilderStore.setState((prev) => ({
        ...prev,
        tool: {
          ...prev.tool,
          parameters: [
            paramWithBothFlags,
            paramWithLongFlagOnly,
            paramWithNoFlags,
          ],
        },
      }));

      render(<ParameterList title="Parameters" />);

      expect(screen.getByText("test-param")).toBeInTheDocument();
      expect(screen.getByText("(--verbose, -v)")).toBeInTheDocument();

      expect(screen.getByText("long-only")).toBeInTheDocument();
      expect(screen.getByText("(--long-only)")).toBeInTheDocument();

      expect(screen.getByText("no-flags")).toBeInTheDocument();
      const noFlagsCard = screen.getByText("no-flags").closest("div");
      expect(noFlagsCard?.textContent).not.toContain("(--");
    });

    it("highlights the selected parameter", () => {
      const parameter = createTestParameter();
      toolBuilderStore.setState((prev) => ({
        ...prev,
        tool: { ...prev.tool, parameters: [parameter] },
        selectedParameter: parameter,
      }));

      render(<ParameterList title="Parameters" />);

      const paramCard =
        screen.getByText("test-param").closest("div[data-key]") ||
        screen.getByText("test-param").closest("div.p-3");
      expect(paramCard).toHaveClass("bg-muted", "border-primary");
    });

    it("shows the remove button and triggers the correct action on click", () => {
      const parameter = createTestParameter();
      toolBuilderStore.setState((prev) => ({
        ...prev,
        tool: { ...prev.tool, parameters: [parameter] },
      }));

      render(<ParameterList title="Parameters" />);

      const removeButtons = screen.getAllByRole("button");
      const removeButton = removeButtons.find(
        (btn) => btn.querySelector("svg") && btn.className.includes("h-6 w-6")
      );

      expect(removeButton).toBeInTheDocument();

      fireEvent.click(removeButton!);
    });
  });

  describe("Badges & Validation", () => {
    it("shows the required badge if isRequired is true", () => {
      const requiredParam = createTestParameter({ isRequired: true });
      const optionalParam = createTestParameter({
        id: "param2",
        name: "optional-param",
        isRequired: false,
      });

      toolBuilderStore.setState((prev) => ({
        ...prev,
        tool: { ...prev.tool, parameters: [requiredParam, optionalParam] },
      }));

      render(<ParameterList title="Parameters" />);

      const requiredCard = screen.getByText("test-param").closest("div.p-3");
      const optionalCard = screen
        .getByText("optional-param")
        .closest("div.p-3");

      expect(requiredCard).toHaveTextContent("required");
      expect(optionalCard).not.toHaveTextContent("required");
    });

    it("shows the correct badge for parameterType", () => {
      const parameters = [
        createTestParameter({
          id: "flag",
          name: "flag-param",
          parameterType: "Flag",
        }),
        createTestParameter({
          id: "option",
          name: "option-param",
          parameterType: "Option",
        }),
        createTestParameter({
          id: "argument",
          name: "argument-param",
          parameterType: "Argument",
        }),
      ];

      toolBuilderStore.setState((prev) => ({
        ...prev,
        tool: { ...prev.tool, parameters },
      }));

      render(<ParameterList title="Parameters" />);

      expect(screen.getByText("Flag")).toBeInTheDocument();
      expect(screen.getByText("Option")).toBeInTheDocument();
      expect(screen.getByText("Argument")).toBeInTheDocument();
    });

    it("shows the correct badge for dataType", () => {
      const parameters = [
        createTestParameter({
          id: "string",
          name: "string-param",
          dataType: "String",
        }),
        createTestParameter({
          id: "number",
          name: "number-param",
          dataType: "Number",
        }),
        createTestParameter({
          id: "boolean",
          name: "boolean-param",
          dataType: "Boolean",
        }),
        createTestParameter({
          id: "enum",
          name: "enum-param",
          dataType: "Enum",
        }),
      ];

      toolBuilderStore.setState((prev) => ({
        ...prev,
        tool: { ...prev.tool, parameters },
      }));

      render(<ParameterList title="Parameters" />);

      expect(screen.getByText("String")).toBeInTheDocument();
      expect(screen.getByText("Number")).toBeInTheDocument();
      expect(screen.getByText("Boolean")).toBeInTheDocument();
      expect(screen.getByText("Enum")).toBeInTheDocument();
    });

    it("shows the global badge if isGlobal is true", () => {
      const globalParam = createTestParameter({ isGlobal: true });

      toolBuilderStore.setState((prev) => ({
        ...prev,
        tool: { ...prev.tool, parameters: [globalParam] },
      }));

      render(<ParameterList title="Global Parameters" isGlobal />);

      const globalCard = screen.getByText("test-param").closest("div.p-3");
      expect(globalCard).toHaveTextContent("global");
    });

    it("shows exclusion group badges with correct group names and icons", () => {
      const parameter = createTestParameter();
      const exclusionGroup = createTestExclusionGroup([parameter.id]);
      exclusionGroup.commandId = "test-command";

      toolBuilderStore.setState((prev) => ({
        ...prev,
        tool: {
          ...prev.tool,
          parameters: [parameter],
          exclusionGroups: [exclusionGroup],
        },
      }));

      render(<ParameterList title="Parameters" />);

      expect(screen.getByText("Test Group")).toBeInTheDocument();
      const groupBadge = screen.getByText("Test Group").closest("span");
      expect(groupBadge?.querySelector("svg")).toBeInTheDocument();
    });

    it("shows the error icon if the default value is invalid", () => {
      const invalidParam = createTestParameter({
        dataType: "Number",
        defaultValue: "invalid-number",
        validations: [
          {
            id: "val1",
            parameterId: "param1",
            validationType: "min_value",
            validationValue: "0",
            errorMessage: "Must be positive",
          },
        ],
      });

      toolBuilderStore.setState((prev) => ({
        ...prev,
        tool: { ...prev.tool, parameters: [invalidParam] },
      }));

      render(<ParameterList title="Parameters" />);

      const paramCard = screen.getByText("test-param").closest("div.p-3");
      const errorIcon = paramCard?.querySelector(
        "svg[class*='text-destructive']"
      );
      expect(errorIcon).toBeInTheDocument();
    });

    it("shows the success icon if the default value is valid and present", () => {
      const validParam = createTestParameter({
        dataType: "String",
        defaultValue: "valid-value",
      });

      toolBuilderStore.setState((prev) => ({
        ...prev,
        tool: { ...prev.tool, parameters: [validParam] },
      }));

      render(<ParameterList title="Parameters" />);

      const paramCard = screen.getByText("test-param").closest("div.p-3");
      const successIcon = paramCard?.querySelector(
        "svg[class*='text-green-500']"
      );
      expect(successIcon).toBeInTheDocument();
    });
  });

  describe("Interactions", () => {
    it("clicking a parameter card selects it", () => {
      const parameter = createTestParameter();
      toolBuilderStore.setState((prev) => ({
        ...prev,
        tool: { ...prev.tool, parameters: [parameter] },
      }));

      render(<ParameterList title="Parameters" />);

      const paramCard = screen.getByText("test-param").closest("div.p-3");
      expect(paramCard).toBeInTheDocument();

      fireEvent.click(paramCard!);

      const updatedState = toolBuilderStore.state;
      expect(updatedState.selectedParameter?.id).toBe(parameter.id);
    });

    it("clicking the remove button does not select the parameter", () => {
      const parameter = createTestParameter();
      toolBuilderStore.setState((prev) => ({
        ...prev,
        tool: { ...prev.tool, parameters: [parameter] },
        selectedParameter: null,
      }));

      render(<ParameterList title="Parameters" />);

      const removeButtons = screen.getAllByRole("button");
      const removeButton = removeButtons.find(
        (btn) => btn.querySelector("svg") && btn.className.includes("h-6 w-6")
      );

      fireEvent.click(removeButton!);

      const updatedState = toolBuilderStore.state;
      expect(updatedState.selectedParameter).toBeNull();
    });

    it("add button creates a new parameter with correct context for command parameters", () => {
      toolBuilderStore.setState((prev) => ({
        ...prev,
        selectedParameter: null,
      }));

      render(<ParameterList title="Parameters" />);

      const addButton = screen.getByRole("button");
      fireEvent.click(addButton);

      const updatedState = toolBuilderStore.state;
      expect(updatedState.selectedParameter).toBeTruthy();
      expect(updatedState.selectedParameter?.isGlobal).toBe(false);
      expect(updatedState.selectedParameter?.command).toBe("test-command");
    });

    it("add button creates a new parameter with correct context for global parameters", () => {
      toolBuilderStore.setState((prev) => ({
        ...prev,
        selectedParameter: null,
        tool: { ...prev.tool, parameters: [] },
      }));

      render(<ParameterList title="Global Parameters" isGlobal />);

      const addButton = screen.getByRole("button");
      fireEvent.click(addButton);

      const updatedState = toolBuilderStore.state;
      expect(updatedState.selectedParameter).toBeTruthy();
      expect(updatedState.selectedParameter?.isGlobal).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("renders correctly when there are no parameters", () => {
      toolBuilderStore.setState((prev) => ({
        ...prev,
        tool: { ...prev.tool, parameters: [] },
      }));

      render(<ParameterList title="Empty Parameters" />);

      expect(screen.getByText("Empty Parameters (0)")).toBeInTheDocument();
      expect(screen.getByRole("button")).toBeInTheDocument();
      expect(screen.queryByText("test-param")).not.toBeInTheDocument();
    });

    it("handles parameters with missing or undefined fields gracefully", () => {
      const paramWithMissingFields = createTestParameter({
        longFlag: "",
        shortFlag: "",
        defaultValue: undefined,
        validations: undefined,
      });

      toolBuilderStore.setState((prev) => ({
        ...prev,
        tool: { ...prev.tool, parameters: [paramWithMissingFields] },
      }));

      render(<ParameterList title="Parameters" />);

      expect(screen.getByText("test-param")).toBeInTheDocument();
      expect(screen.getByText("Option")).toBeInTheDocument();
      expect(screen.getByText("String")).toBeInTheDocument();
    });

    it("handles exclusion groups with no matching parameters", () => {
      const parameter = createTestParameter();
      const exclusionGroupWithNoParams = createTestExclusionGroup([]);
      exclusionGroupWithNoParams.commandId = "test-command";

      toolBuilderStore.setState((prev) => ({
        ...prev,
        tool: {
          ...prev.tool,
          parameters: [parameter],
          exclusionGroups: [exclusionGroupWithNoParams],
        },
      }));

      render(<ParameterList title="Parameters" />);

      expect(screen.getByText("test-param")).toBeInTheDocument();
      expect(screen.queryByText("Test Group")).not.toBeInTheDocument();
    });

    it("handles parameters with both longFlag and shortFlag", () => {
      const paramWithBothFlags = createTestParameter({
        longFlag: "--verbose",
        shortFlag: "-v",
      });

      toolBuilderStore.setState((prev) => ({
        ...prev,
        tool: { ...prev.tool, parameters: [paramWithBothFlags] },
      }));

      render(<ParameterList title="Parameters" />);

      expect(screen.getByText("test-param")).toBeInTheDocument();
      expect(screen.getByText("(--verbose, -v)")).toBeInTheDocument();
    });

    it("handles parameters with only longFlag", () => {
      const paramWithLongFlag = createTestParameter({
        longFlag: "--verbose",
        shortFlag: "",
      });

      toolBuilderStore.setState((prev) => ({
        ...prev,
        tool: { ...prev.tool, parameters: [paramWithLongFlag] },
      }));

      render(<ParameterList title="Parameters" />);

      expect(screen.getByText("test-param")).toBeInTheDocument();
      expect(screen.getByText("(--verbose)")).toBeInTheDocument();
    });

    it("handles parameters with only shortFlag", () => {
      const paramWithShortFlag = createTestParameter({
        longFlag: "",
        shortFlag: "-v",
      });

      toolBuilderStore.setState((prev) => ({
        ...prev,
        tool: { ...prev.tool, parameters: [paramWithShortFlag] },
      }));

      render(<ParameterList title="Parameters" />);

      expect(screen.getByText("test-param")).toBeInTheDocument();
      expect(screen.getByText("(-v)")).toBeInTheDocument();
    });

    it("handles parameters with no flags", () => {
      const paramWithNoFlags = createTestParameter({
        longFlag: "",
        shortFlag: "",
      });

      toolBuilderStore.setState((prev) => ({
        ...prev,
        tool: { ...prev.tool, parameters: [paramWithNoFlags] },
      }));

      render(<ParameterList title="Parameters" />);

      expect(screen.getByText("test-param")).toBeInTheDocument();
      const paramCard = screen.getByText("test-param").closest("div");
      expect(paramCard?.textContent).not.toContain("(");
    });

    it("handles when selectedCommand is null", () => {
      toolBuilderStore.setState((prev) => ({
        ...prev,
        selectedCommand: null,
        tool: { ...prev.tool, parameters: [] },
      }));

      render(<ParameterList title="Parameters" />);

      expect(screen.getByText("Parameters (0)")).toBeInTheDocument();
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("handles when selectedParameter is null", () => {
      const parameter = createTestParameter();
      toolBuilderStore.setState((prev) => ({
        ...prev,
        selectedParameter: null,
        tool: { ...prev.tool, parameters: [parameter] },
      }));

      render(<ParameterList title="Parameters" />);

      const paramCard = screen.getByText("test-param").closest("div.p-3");
      expect(paramCard).not.toHaveClass("bg-muted", "border-primary");
    });
  });
});
