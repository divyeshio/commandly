import { createTestParameter, defaultTool } from "../test-utils";
import { Parameter, ExclusionGroup } from "@/components/commandly/types/tool";
import { getCommandParameters } from "@/components/commandly/utils/tool";
import { ParameterList } from "@/components/tool-editor/parameter-list";
import {
  ToolBuilderProvider,
  ToolBuilderState,
  parameterRef,
  useToolBuilder,
} from "@/components/tool-editor/tool-editor.context";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ReactNode } from "react";

const createTestExclusionGroup = (parameterKeys: string[] = []): ExclusionGroup => ({
  key: "test-group-key",
  displayName: "Test Group",
  exclusionType: "mutual_exclusive",
  parameterKeys,
});

const baseTestState = (): Partial<ToolBuilderState> => ({
  tool: {
    ...defaultTool("test-tool", "Test tool"),
    commands: [
      {
        key: "test-command-key",
        displayName: "test-command",
        description: "Test command",
        sortOrder: 0,
      },
    ],
  },
  selectedCommandKey: "test-command-key",
  selectedParameter: null,
});

/** Places parameters on the selected command, which is where command-scoped ones live. */
const withCommandParams = (
  state: Partial<ToolBuilderState>,
  parameters: Parameter[],
): Partial<ToolBuilderState> => ({
  ...state,
  tool: {
    ...state.tool!,
    parameters: [],
    commands: (state.tool?.commands ?? []).map((command) =>
      command.key === "test-command-key" ? { ...command, parameters } : command,
    ),
  },
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
      createTestParameter({ key: "param2-key", displayName: "param2" }),
    ];
    const state = withCommandParams(baseTestState(), parameters);
    renderWithProvider(<ParameterList title="Test Parameters" />, state);
    expect(screen.getByText("Test Parameters (2)")).toBeInTheDocument();
  });

  it("renders the globe icon for root parameters", () => {
    const rootParam = createTestParameter();
    const state = baseTestState();
    state.selectedCommandKey = null;
    state.tool = { ...state.tool!, parameters: [rootParam] };
    renderWithProvider(<ParameterList title="Root Parameters" />, state);
    expect(screen.getByText("Root Parameters (1)")).toBeInTheDocument();
    const heading = screen.getByRole("heading", { level: 3 });
    expect(heading.querySelector("svg")).toBeInTheDocument();
  });

  it("renders the add button", () => {
    renderWithProvider(<ParameterList title="Parameters" />, baseTestState());
    const addButton = screen.getByRole("button");
    expect(addButton).toBeInTheDocument();
    expect(addButton.querySelector("svg")).toBeInTheDocument();
  });

  it("renders the correct number of parameter cards based on the parameters array", () => {
    const parameters = [
      createTestParameter({ key: "param1-key", displayName: "param1" }),
      createTestParameter({ key: "param2-key", displayName: "param2" }),
      createTestParameter({ key: "param3-key", displayName: "param3" }),
    ];
    const state = withCommandParams(baseTestState(), parameters);
    renderWithProvider(<ParameterList title="Parameters" />, state);
    expect(screen.getByText("param1")).toBeInTheDocument();
    expect(screen.getByText("param2")).toBeInTheDocument();
    expect(screen.getByText("param3")).toBeInTheDocument();
  });

  describe("Parameter Card Display", () => {
    it("displays the correct icon for each parameterType", () => {
      const parameters = [
        createTestParameter({
          key: "flag-param-key",
          displayName: "flag-param",
          parameterType: "Flag",
        }),
        createTestParameter({
          key: "--option-param-key",
          displayName: "option-param",
          parameterType: "Option",
        }),
        createTestParameter({
          key: "argument-param-key",
          displayName: "argument-param",
          parameterType: "Argument",
        }),
      ];
      const state = withCommandParams(baseTestState(), parameters);
      renderWithProvider(<ParameterList title="Parameters" />, state);

      const flagCard = screen.getByText("flag-param").closest("div");
      const optionCard = screen.getByText("option-param").closest("div");
      const argumentCard = screen.getByText("argument-param").closest("div");
      expect(flagCard?.querySelector("svg")).toBeInTheDocument();
      expect(optionCard?.querySelector("svg")).toBeInTheDocument();
      expect(argumentCard?.querySelector("svg")).toBeInTheDocument();
    });

    it("shows parameter name and its flag forms", () => {
      const paramWithShortName = createTestParameter({
        key: "--verbose",
        displayName: "verbose",
        aliases: ["-v"],
      });
      const paramWithNoAliases = createTestParameter({
        key: "--silent",
        displayName: "silent",
        aliases: [],
      });
      const argumentParam = createTestParameter({
        key: "no-flags-key",
        displayName: "no-flags",
        parameterType: "Argument",
        aliases: [],
      });

      const state = withCommandParams(baseTestState(), [
        paramWithShortName,
        paramWithNoAliases,
        argumentParam,
      ]);
      renderWithProvider(<ParameterList title="Parameters" />, state);

      expect(screen.getByText("verbose")).toBeInTheDocument();
      expect(screen.getByText("(--verbose, -v)")).toBeInTheDocument();
      expect(screen.getByText("silent")).toBeInTheDocument();
      expect(screen.getByText("(--silent)")).toBeInTheDocument();
      expect(screen.getByText("no-flags")).toBeInTheDocument();
      const argumentCard = screen.getByText("no-flags").closest("div");
      expect(argumentCard?.textContent).not.toContain("(--");
    });

    it("shows the remove button and triggers the correct action on click", () => {
      const parameter = createTestParameter();
      const state = withCommandParams(baseTestState(), [parameter]);
      renderWithProvider(<ParameterList title="Parameters" />, state);

      const removeButton = screen.getByRole("button", {
        name: `Remove ${parameter.displayName}`,
      });
      expect(removeButton).toBeInTheDocument();
      fireEvent.click(removeButton);
    });
  });

  describe("Badges & Validation", () => {
    it("shows the required badge if isRequired is true", () => {
      const requiredParam = createTestParameter({ isRequired: true });
      const optionalParam = createTestParameter({
        key: "optional-param-key",
        displayName: "optional-param",
        isRequired: false,
      });
      const state = withCommandParams(baseTestState(), [requiredParam, optionalParam]);
      renderWithProvider(<ParameterList title="Parameters" />, state);

      const requiredCard = screen.getByText("test-param").closest("div.p-3");
      const optionalCard = screen.getByText("optional-param").closest("div.p-3");
      expect(requiredCard).toHaveTextContent("required");
      expect(optionalCard).not.toHaveTextContent("required");
    });

    it("shows the correct badge for parameterType", () => {
      const parameters = [
        createTestParameter({
          key: "flag-param-key",
          displayName: "flag-param",
          parameterType: "Flag",
        }),
        createTestParameter({
          key: "--option-param-key",
          displayName: "option-param",
          parameterType: "Option",
        }),
        createTestParameter({
          key: "argument-param-key",
          displayName: "argument-param",
          parameterType: "Argument",
        }),
      ];
      const state = withCommandParams(baseTestState(), parameters);
      renderWithProvider(<ParameterList title="Parameters" />, state);

      expect(screen.getByText("Flag")).toBeInTheDocument();
      expect(screen.getByText("Option")).toBeInTheDocument();
      expect(screen.getByText("Argument")).toBeInTheDocument();
    });

    it("shows the correct badge for dataType", () => {
      const parameters = [
        createTestParameter({
          key: "string-param-key",
          displayName: "string-param",
          dataType: "String",
        }),
        createTestParameter({
          key: "number-param-key",
          displayName: "number-param",
          dataType: "Number",
        }),
        createTestParameter({
          key: "boolean-param-key",
          displayName: "boolean-param",
          dataType: "Boolean",
        }),
        createTestParameter({ key: "enum-param-key", displayName: "enum-param", dataType: "Enum" }),
      ];
      const state = withCommandParams(baseTestState(), parameters);
      renderWithProvider(<ParameterList title="Parameters" />, state);

      expect(screen.getByText("String")).toBeInTheDocument();
      expect(screen.getByText("Number")).toBeInTheDocument();
      expect(screen.getByText("Boolean")).toBeInTheDocument();
      expect(screen.getByText("Enum")).toBeInTheDocument();
    });

    it("shows the inherited badge for recursive parameters", () => {
      const inheritedParam = createTestParameter({ recursive: true });
      const state = withCommandParams(baseTestState(), [inheritedParam]);
      renderWithProvider(<ParameterList title="Parameters" />, state);

      const inheritedCard = screen.getByText("test-param").closest("div.p-3");
      expect(inheritedCard).toHaveTextContent("inherited");
    });

    it("shows the inherited badge for a command-scoped recursive parameter", () => {
      const recursiveParam = createTestParameter({ recursive: true });
      const state = withCommandParams(baseTestState(), [recursiveParam]);
      renderWithProvider(<ParameterList title="Parameters" />, state);

      const recursiveCard = screen.getByText("test-param").closest("div.p-3");
      expect(recursiveCard).toHaveTextContent("inherited");
    });

    it("shows exclusion group badges with correct group names and icons", () => {
      const parameter = createTestParameter();
      const exclusionGroup = createTestExclusionGroup([parameter.key]);

      const state = withCommandParams(baseTestState(), [parameter]);
      state.tool!.commands = state.tool!.commands!.map((command) =>
        command.key === "test-command-key"
          ? { ...command, exclusionGroups: [exclusionGroup] }
          : command,
      );
      renderWithProvider(<ParameterList title="Parameters" />, state);

      expect(screen.getByText("Test Group")).toBeInTheDocument();
      const groupBadge = screen.getByText("Test Group").closest("span");
      expect(groupBadge?.querySelector("svg")).toBeInTheDocument();
    });
  });

  describe("Interactions", () => {
    it("clicking a parameter card selects it in context", () => {
      const parameter = createTestParameter();
      const state = withCommandParams(baseTestState(), [parameter]);
      renderWithProvider(<ParameterList title="Parameters" />, state);

      const paramCard = screen.getByText("test-param").closest("div.p-3");
      expect(paramCard).toBeInTheDocument();
      fireEvent.click(paramCard!);

      expect(capturedCtx.contextSelection.parameterRefs).toContain(
        parameterRef("test-command-key", parameter.key),
      );
    });

    it("clicking the remove button does not select the parameter in context", () => {
      const parameter = createTestParameter();
      const state = withCommandParams(baseTestState(), [parameter]);
      renderWithProvider(<ParameterList title="Parameters" />, state);

      const removeButton = screen.getByRole("button", {
        name: `Remove ${parameter.displayName}`,
      });
      fireEvent.click(removeButton);

      expect(capturedCtx.contextSelection.parameterRefs).not.toContain(
        parameterRef("test-command-key", parameter.key),
      );
    });

    it("add button creates a new parameter with correct context for command parameters", () => {
      const state = baseTestState();
      state.selectedParameter = null;
      renderWithProvider(<ParameterList title="Parameters" />, state);

      const addButton = screen.getByRole("button");
      fireEvent.click(addButton);

      expect(capturedCtx.selectedParameter).toBeTruthy();
      expect(capturedCtx.selectedParameter?.recursive).toBe(undefined);
    });

    it("add button creates a new parameter with correct context for root parameters", () => {
      const state = baseTestState();
      state.selectedParameter = null;
      state.selectedCommandKey = null;
      state.tool = { ...state.tool!, parameters: [] };
      renderWithProvider(<ParameterList title="Root Parameters" />, state);

      const addButton = screen.getByRole("button");
      fireEvent.click(addButton);

      expect(capturedCtx.selectedParameter).toBeTruthy();
      expect(capturedCtx.selectedParameter?.recursive).toBe(true);
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
        aliases: [],
        validations: undefined,
      });
      const state = withCommandParams(baseTestState(), [paramWithMissingFields]);
      renderWithProvider(<ParameterList title="Parameters" />, state);

      expect(screen.getByText("test-param")).toBeInTheDocument();
      expect(screen.getByText("Option")).toBeInTheDocument();
      expect(screen.getByText("String")).toBeInTheDocument();
    });

    it("handles exclusion groups with no matching parameters", () => {
      const parameter = createTestParameter();
      const exclusionGroupWithNoParams = createTestExclusionGroup([]);

      const state = withCommandParams(baseTestState(), [parameter]);
      state.tool!.commands = state.tool!.commands!.map((command) =>
        command.key === "test-command-key"
          ? { ...command, exclusionGroups: [exclusionGroupWithNoParams] }
          : command,
      );
      renderWithProvider(<ParameterList title="Parameters" />, state);

      expect(screen.getByText("test-param")).toBeInTheDocument();
      expect(screen.queryByText("Test Group")).not.toBeInTheDocument();
    });

    it("handles parameters with multiple aliases", () => {
      const paramWithBothFlags = createTestParameter({
        key: "--verbose",
        displayName: "verbose",
        aliases: ["-v", "--extended"],
      });
      const state = withCommandParams(baseTestState(), [paramWithBothFlags]);
      renderWithProvider(<ParameterList title="Parameters" />, state);

      expect(screen.getByText("verbose")).toBeInTheDocument();
      expect(screen.getByText("(--verbose, -v, --extended)")).toBeInTheDocument();
    });
  });

  describe("Drag and Drop", () => {
    it("renders a drag handle for each parameter card", () => {
      const parameters = [
        createTestParameter({ key: "p1", displayName: "param-one" }),
        createTestParameter({ key: "p2", displayName: "param-two" }),
      ];
      const state = withCommandParams(baseTestState(), parameters);
      renderWithProvider(<ParameterList title="Parameters" />, state);

      const cards = screen.getAllByText(/param-one|param-two/);
      expect(cards.length).toBeGreaterThanOrEqual(2);

      // Each card exposes a reorder handle and an edit action.
      expect(screen.getAllByRole("button", { name: /^(Reorder|Edit) / })).toHaveLength(4);
    });

    it("reorderParameters updates sortOrder in context", () => {
      const p1 = createTestParameter({
        key: "p1",
        displayName: "param-one",
      });
      const p2 = createTestParameter({
        key: "p2",
        displayName: "param-two",
      });
      const p3 = createTestParameter({
        key: "p3",
        displayName: "param-three",
      });
      const state = withCommandParams(baseTestState(), [p1, p2, p3]);
      renderWithProvider(<ParameterList title="Parameters" />, state);

      expect(typeof capturedCtx.reorderParameters).toBe("function");

      act(() => {
        capturedCtx.reorderParameters(["p3", "p1", "p2"]);
      });

      const reordered = getCommandParameters(capturedCtx.tool, "test-command-key");
      const sortOrderOf = (key: string) => reordered.find((p) => p.key === key)?.sortOrder;
      expect(sortOrderOf("p3")).toBe(0);
      expect(sortOrderOf("p1")).toBe(1);
      expect(sortOrderOf("p2")).toBe(2);
    });
  });

  describe("Context selection refs", () => {
    it("follows a command rename", () => {
      renderWithProvider(<ParameterList title="Parameters" />, baseTestState());

      act(() => {
        capturedCtx.setContextSelection({
          commandKeys: ["test-command-key"],
          parameterRefs: [parameterRef("test-command-key", "--test-param-key")],
        });
      });
      act(() => {
        capturedCtx.updateCommand("test-command-key", { key: "renamed-command" });
      });

      expect(capturedCtx.contextSelection.commandKeys).toEqual(["renamed-command"]);
      expect(capturedCtx.contextSelection.parameterRefs).toEqual([
        parameterRef("renamed-command", "--test-param-key"),
      ]);
    });

    it("drops refs owned by a deleted command", () => {
      renderWithProvider(<ParameterList title="Parameters" />, baseTestState());

      act(() => {
        capturedCtx.setContextSelection({
          commandKeys: ["test-command-key"],
          parameterRefs: [
            parameterRef("test-command-key", "--test-param-key"),
            parameterRef(null, "help"),
          ],
        });
      });
      act(() => {
        capturedCtx.deleteCommand("test-command-key");
      });

      expect(capturedCtx.contextSelection.commandKeys).toEqual([]);
      expect(capturedCtx.contextSelection.parameterRefs).toEqual([parameterRef(null, "help")]);
    });
  });
});
