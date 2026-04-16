import { Parameter, ExclusionGroup } from "@/components/commandly/types/flat";
import { ParameterList } from "@/components/tool-editor/parameter-list";
import {
  ToolBuilderProvider,
  ToolBuilderState,
  useToolBuilder,
} from "@/components/tool-editor/tool-editor.context";
import { defaultTool } from "@/lib/utils";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ReactNode } from "react";

const createTestParameter = (overrides: Partial<Parameter> = {}): Parameter => ({
  key: "test-param-key",
  name: "test-param",
  description: "Test parameter",
  parameterType: "Option",
  dataType: "String",
  isRequired: false,
  isRepeatable: false,
  isGlobal: false,
  longFlag: "--test",
  shortFlag: "-t",
  commandKey: "test-command-key",
  ...overrides,
});

const createTestExclusionGroup = (parameterKeys: string[] = []): ExclusionGroup => ({
  key: "test-group-key",
  name: "Test Group",
  exclusionType: "mutual_exclusive",
  parameterKeys,
  commandKey: "test-command-key",
});

const baseTestState = (): Partial<ToolBuilderState> => ({
  tool: {
    ...defaultTool("test-tool", "Test tool"),
    commands: [
      {
        key: "test-command-key",
        name: "test-command",
        description: "Test command",
        sortOrder: 0,
      },
    ],
  },
  selectedCommand: {
    key: "test-command-key",
    name: "test-command",
    description: "Test command",
    sortOrder: 0,
  },
  selectedParameter: null,
});

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

describe("ParameterList - Rendering & Structure", () => {
  it("renders the title and parameter count correctly", () => {
    const parameters = [
      createTestParameter(),
      createTestParameter({ key: "param2-key", name: "param2" }),
    ];
    const state = baseTestState();
    state.tool = { ...state.tool!, parameters };
    renderWithProvider(<ParameterList title="Test Parameters" />, state);
    expect(screen.getByText("Test Parameters (2)")).toBeInTheDocument();
  });

  it("renders the globe icon when isGlobal is true", () => {
    const globalParam = createTestParameter({ isGlobal: true });
    const state = baseTestState();
    state.tool = { ...state.tool!, parameters: [globalParam] };
    renderWithProvider(
      <ParameterList
        title="Global Parameters"
        isGlobal
      />,
      state,
    );
    expect(screen.getByText("Global Parameters (1)")).toBeInTheDocument();
    const heading = screen.getByRole("heading", { level: 3 });
    expect(heading.querySelector("svg")).toBeInTheDocument();
  });

  it("renders the add button and triggers the correct action on click", () => {
    renderWithProvider(<ParameterList title="Parameters" />, baseTestState());
    const addButton = screen.getByRole("button");
    expect(addButton).toBeInTheDocument();
    expect(addButton.querySelector("svg")).toBeInTheDocument();
    fireEvent.click(addButton);
  });

  it("renders the correct number of parameter cards based on the parameters array", () => {
    const parameters = [
      createTestParameter({ key: "param1-key", name: "param1" }),
      createTestParameter({ key: "param2-key", name: "param2" }),
      createTestParameter({ key: "param3-key", name: "param3" }),
    ];
    const state = baseTestState();
    state.tool = { ...state.tool!, parameters };
    renderWithProvider(<ParameterList title="Parameters" />, state);
    expect(screen.getByText("param1")).toBeInTheDocument();
    expect(screen.getByText("param2")).toBeInTheDocument();
    expect(screen.getByText("param3")).toBeInTheDocument();
  });

  describe("Parameter Card Display", () => {
    it("displays the correct icon for each parameterType", () => {
      const parameters = [
        createTestParameter({ key: "flag-param-key", name: "flag-param", parameterType: "Flag" }),
        createTestParameter({
          key: "option-param-key",
          name: "option-param",
          parameterType: "Option",
        }),
        createTestParameter({
          key: "argument-param-key",
          name: "argument-param",
          parameterType: "Argument",
        }),
      ];
      const state = baseTestState();
      state.tool = { ...state.tool!, parameters };
      renderWithProvider(<ParameterList title="Parameters" />, state);

      const flagCard = screen.getByText("flag-param").closest("div");
      const optionCard = screen.getByText("option-param").closest("div");
      const argumentCard = screen.getByText("argument-param").closest("div");
      expect(flagCard?.querySelector("svg")).toBeInTheDocument();
      expect(optionCard?.querySelector("svg")).toBeInTheDocument();
      expect(argumentCard?.querySelector("svg")).toBeInTheDocument();
    });

    it("shows parameter name and flags if present", () => {
      const paramWithBothFlags = createTestParameter({ longFlag: "--verbose", shortFlag: "-v" });
      const paramWithLongFlagOnly = createTestParameter({
        key: "long-only-key",
        name: "long-only",
        longFlag: "--long-only",
        shortFlag: "",
      });
      const paramWithNoFlags = createTestParameter({
        key: "no-flags-key",
        name: "no-flags",
        longFlag: "",
        shortFlag: "",
      });

      const state = baseTestState();
      state.tool = {
        ...state.tool!,
        parameters: [paramWithBothFlags, paramWithLongFlagOnly, paramWithNoFlags],
      };
      renderWithProvider(<ParameterList title="Parameters" />, state);

      expect(screen.getByText("test-param")).toBeInTheDocument();
      expect(screen.getByText("(--verbose, -v)")).toBeInTheDocument();
      expect(screen.getByText("long-only")).toBeInTheDocument();
      expect(screen.getByText("(--long-only)")).toBeInTheDocument();
      expect(screen.getByText("no-flags")).toBeInTheDocument();
      const noFlagsCard = screen.getByText("no-flags").closest("div");
      expect(noFlagsCard?.textContent).not.toContain("(--");
    });

    it("shows the remove button and triggers the correct action on click", () => {
      const parameter = createTestParameter();
      const state = baseTestState();
      state.tool = { ...state.tool!, parameters: [parameter] };
      renderWithProvider(<ParameterList title="Parameters" />, state);

      const removeButtons = screen.getAllByRole("button");
      const removeButton = removeButtons.find(
        (btn) => btn.querySelector("svg") && btn.className.includes("h-6 w-6"),
      );
      expect(removeButton).toBeInTheDocument();
      fireEvent.click(removeButton!);
    });
  });

  describe("Badges & Validation", () => {
    it("shows the required badge if isRequired is true", () => {
      const requiredParam = createTestParameter({ isRequired: true });
      const optionalParam = createTestParameter({
        key: "optional-param-key",
        name: "optional-param",
        isRequired: false,
      });
      const state = baseTestState();
      state.tool = { ...state.tool!, parameters: [requiredParam, optionalParam] };
      renderWithProvider(<ParameterList title="Parameters" />, state);

      const requiredCard = screen.getByText("test-param").closest("div.p-3");
      const optionalCard = screen.getByText("optional-param").closest("div.p-3");
      expect(requiredCard).toHaveTextContent("required");
      expect(optionalCard).not.toHaveTextContent("required");
    });

    it("shows the correct badge for parameterType", () => {
      const parameters = [
        createTestParameter({ key: "flag-param-key", name: "flag-param", parameterType: "Flag" }),
        createTestParameter({
          key: "option-param-key",
          name: "option-param",
          parameterType: "Option",
        }),
        createTestParameter({
          key: "argument-param-key",
          name: "argument-param",
          parameterType: "Argument",
        }),
      ];
      const state = baseTestState();
      state.tool = { ...state.tool!, parameters };
      renderWithProvider(<ParameterList title="Parameters" />, state);

      expect(screen.getByText("Flag")).toBeInTheDocument();
      expect(screen.getByText("Option")).toBeInTheDocument();
      expect(screen.getByText("Argument")).toBeInTheDocument();
    });

    it("shows the correct badge for dataType", () => {
      const parameters = [
        createTestParameter({ key: "string-param-key", name: "string-param", dataType: "String" }),
        createTestParameter({ key: "number-param-key", name: "number-param", dataType: "Number" }),
        createTestParameter({
          key: "boolean-param-key",
          name: "boolean-param",
          dataType: "Boolean",
        }),
        createTestParameter({ key: "enum-param-key", name: "enum-param", dataType: "Enum" }),
      ];
      const state = baseTestState();
      state.tool = { ...state.tool!, parameters };
      renderWithProvider(<ParameterList title="Parameters" />, state);

      expect(screen.getByText("String")).toBeInTheDocument();
      expect(screen.getByText("Number")).toBeInTheDocument();
      expect(screen.getByText("Boolean")).toBeInTheDocument();
      expect(screen.getByText("Enum")).toBeInTheDocument();
    });

    it("shows the global badge if isGlobal is true", () => {
      const globalParam = createTestParameter({ isGlobal: true });
      const state = baseTestState();
      state.tool = { ...state.tool!, parameters: [globalParam] };
      renderWithProvider(
        <ParameterList
          title="Global Parameters"
          isGlobal
        />,
        state,
      );

      const globalCard = screen.getByText("test-param").closest("div.p-3");
      expect(globalCard).toHaveTextContent("global");
    });

    it("shows exclusion group badges with correct group names and icons", () => {
      const parameter = createTestParameter();
      const exclusionGroup = createTestExclusionGroup([parameter.key]);
      exclusionGroup.commandKey = "test-command-key";

      const state = baseTestState();
      state.tool = { ...state.tool!, parameters: [parameter], exclusionGroups: [exclusionGroup] };
      renderWithProvider(<ParameterList title="Parameters" />, state);

      expect(screen.getByText("Test Group")).toBeInTheDocument();
      const groupBadge = screen.getByText("Test Group").closest("span");
      expect(groupBadge?.querySelector("svg")).toBeInTheDocument();
    });
  });

  describe("Interactions", () => {
    it("clicking a parameter card selects it in context", () => {
      const parameter = createTestParameter();
      const state = baseTestState();
      state.tool = { ...state.tool!, parameters: [parameter] };
      renderWithProvider(<ParameterList title="Parameters" />, state);

      const paramCard = screen.getByText("test-param").closest("div.p-3");
      expect(paramCard).toBeInTheDocument();
      fireEvent.click(paramCard!);

      expect(capturedCtx.contextSelection.parameterKeys).toContain(parameter.key);
    });

    it("clicking the remove button does not select the parameter in context", () => {
      const parameter = createTestParameter();
      const state = baseTestState();
      state.tool = { ...state.tool!, parameters: [parameter] };
      renderWithProvider(<ParameterList title="Parameters" />, state);

      const removeButtons = screen.getAllByRole("button");
      const removeButton = removeButtons.find(
        (btn) => btn.querySelector("svg") && btn.className.includes("h-6 w-6"),
      );
      fireEvent.click(removeButton!);

      expect(capturedCtx.contextSelection.parameterKeys).not.toContain(parameter.key);
    });

    it("add button creates a new parameter with correct context for command parameters", () => {
      const state = baseTestState();
      state.selectedParameter = null;
      renderWithProvider(<ParameterList title="Parameters" />, state);

      const addButton = screen.getByRole("button");
      fireEvent.click(addButton);

      expect(capturedCtx.selectedParameter).toBeTruthy();
      expect(capturedCtx.selectedParameter?.isGlobal).toBe(undefined);
      expect(capturedCtx.selectedParameter?.commandKey).toBe("test-command-key");
    });

    it("add button creates a new parameter with correct context for global parameters", () => {
      const state = baseTestState();
      state.selectedParameter = null;
      state.tool = { ...state.tool!, parameters: [] };
      renderWithProvider(
        <ParameterList
          title="Global Parameters"
          isGlobal
        />,
        state,
      );

      const addButton = screen.getByRole("button");
      fireEvent.click(addButton);

      expect(capturedCtx.selectedParameter).toBeTruthy();
      expect(capturedCtx.selectedParameter?.isGlobal).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("renders correctly when there are no parameters", () => {
      const state = baseTestState();
      state.tool = { ...state.tool!, parameters: [] };
      renderWithProvider(<ParameterList title="Empty Parameters" />, state);

      expect(screen.getByText("Empty Parameters (0)")).toBeInTheDocument();
      expect(screen.getByRole("button")).toBeInTheDocument();
      expect(screen.queryByText("test-param")).not.toBeInTheDocument();
    });

    it("handles parameters with missing or undefined fields gracefully", () => {
      const paramWithMissingFields = createTestParameter({
        longFlag: "",
        shortFlag: "",
        validations: undefined,
      });
      const state = baseTestState();
      state.tool = { ...state.tool!, parameters: [paramWithMissingFields] };
      renderWithProvider(<ParameterList title="Parameters" />, state);

      expect(screen.getByText("test-param")).toBeInTheDocument();
      expect(screen.getByText("Option")).toBeInTheDocument();
      expect(screen.getByText("String")).toBeInTheDocument();
    });

    it("handles exclusion groups with no matching parameters", () => {
      const parameter = createTestParameter();
      const exclusionGroupWithNoParams = createTestExclusionGroup([]);
      exclusionGroupWithNoParams.commandKey = "test-command";

      const state = baseTestState();
      state.tool = {
        ...state.tool!,
        parameters: [parameter],
        exclusionGroups: [exclusionGroupWithNoParams],
      };
      renderWithProvider(<ParameterList title="Parameters" />, state);

      expect(screen.getByText("test-param")).toBeInTheDocument();
      expect(screen.queryByText("Test Group")).not.toBeInTheDocument();
    });

    it("handles parameters with both longFlag and shortFlag", () => {
      const paramWithBothFlags = createTestParameter({ longFlag: "--verbose", shortFlag: "-v" });
      const state = baseTestState();
      state.tool = { ...state.tool!, parameters: [paramWithBothFlags] };
      renderWithProvider(<ParameterList title="Parameters" />, state);

      expect(screen.getByText("test-param")).toBeInTheDocument();
      expect(screen.getByText("(--verbose, -v)")).toBeInTheDocument();
    });
  });

  describe("Drag and Drop", () => {
    it("renders a drag handle for each parameter card", () => {
      const parameters = [
        createTestParameter({ key: "p1", name: "param-one" }),
        createTestParameter({ key: "p2", name: "param-two" }),
      ];
      const state = baseTestState();
      state.tool = { ...state.tool!, parameters };
      renderWithProvider(<ParameterList title="Parameters" />, state);

      const cards = screen.getAllByText(/param-one|param-two/);
      expect(cards.length).toBeGreaterThanOrEqual(2);

      const allButtons = document.querySelectorAll("button.opacity-0.group-hover\\:opacity-100");
      // Each card has grip + edit buttons (at minimum 2 × 2 = 4 hidden buttons)
      expect(allButtons.length).toBeGreaterThanOrEqual(4);
    });

    it("reorderParameters updates sortOrder in context", () => {
      const p1 = createTestParameter({ key: "p1", name: "param-one", commandKey: "test-command-key" });
      const p2 = createTestParameter({ key: "p2", name: "param-two", commandKey: "test-command-key" });
      const p3 = createTestParameter({ key: "p3", name: "param-three", commandKey: "test-command-key" });
      const state = baseTestState();
      state.tool = { ...state.tool!, parameters: [p1, p2, p3] };
      renderWithProvider(<ParameterList title="Parameters" />, state);

      expect(typeof capturedCtx.reorderParameters).toBe("function");

      act(() => {
        capturedCtx.reorderParameters(["p3", "p1", "p2"]);
      });

      const p3Updated = capturedCtx.tool.parameters.find((p) => p.key === "p3");
      const p1Updated = capturedCtx.tool.parameters.find((p) => p.key === "p1");
      const p2Updated = capturedCtx.tool.parameters.find((p) => p.key === "p2");
      expect(p3Updated?.sortOrder).toBe(0);
      expect(p1Updated?.sortOrder).toBe(1);
      expect(p2Updated?.sortOrder).toBe(2);
    });
  });
});
