import { Command, Tool } from "@/components/commandly/types/flat";
import { CommandTree } from "@/components/tool-editor/command-tree";
import {
  ToolBuilderProvider,
  ToolBuilderState,
  useToolBuilder,
} from "@/components/tool-editor/tool-editor.context";
import { defaultTool } from "@/lib/utils";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { ReactNode } from "react";

const createComplexTool = (): Tool => ({
  binaryName: "my-cli-tool",
  displayName: "My CLI Tool",
  info: {
    description: "A sample CLI tool with nested commands",
    version: "1.0.0",
  },
  commands: [
    {
      key: "my-cli-tool",
      name: "my-cli-tool",
      description: "Main CLI tool command",
      sortOrder: 0,
    },
    {
      key: "config",
      name: "config",
      parentCommandKey: "my-cli-tool",
      description: "Configuration management",
      sortOrder: 1,
    },
    {
      key: "get",
      name: "get",
      parentCommandKey: "config",
      description: "Get configuration values",
      sortOrder: 0,
    },
    {
      key: "set",
      name: "set",
      parentCommandKey: "config",
      description: "Set configuration values",
      sortOrder: 1,
    },
    {
      key: "list",
      name: "list",
      parentCommandKey: "config",
      description: "List all configurations",
      sortOrder: 2,
    },
    {
      key: "data",
      name: "data",
      parentCommandKey: "my-cli-tool",
      description: "Data management operations",
      sortOrder: 2,
    },
    {
      key: "create",
      name: "create",
      parentCommandKey: "data",
      description: "Create new data entries",
      sortOrder: 0,
    },
    {
      key: "read",
      name: "read",
      parentCommandKey: "data",
      description: "Read existing data",
      sortOrder: 1,
    },
    {
      key: "update",
      name: "update",
      parentCommandKey: "data",
      description: "Update existing data",
      sortOrder: 2,
    },
    {
      key: "delete",
      name: "delete",
      parentCommandKey: "data",
      description: "Delete data entries",
      sortOrder: 3,
    },
    {
      key: "utils",
      name: "utils",
      parentCommandKey: "my-cli-tool",
      description: "Utility functions",
      sortOrder: 3,
    },
    {
      key: "validate",
      name: "validate",
      parentCommandKey: "utils",
      description: "Validate data integrity",
      sortOrder: 0,
    },
    {
      key: "backup",
      name: "backup",
      parentCommandKey: "utils",
      description: "Backup operations",
      sortOrder: 1,
    },
    {
      key: "help",
      name: "help",
      parentCommandKey: "my-cli-tool",
      description: "Display help information",
      sortOrder: 4,
    },
  ],
  parameters: [],
  exclusionGroups: [],
  metadata: { supportedInput: [], supportedOutput: [] },
});

const simpleTestTool: Tool = {
  ...defaultTool("test-tool", "Test tool"),
  commands: [
    {
      key: "test-tool",
      name: "test-tool",
      description: "Main command",
      sortOrder: 0,
    },
  ],
};

const simpleTestState: Partial<ToolBuilderState> = {
  tool: simpleTestTool,
  selectedCommand: simpleTestTool.commands[0],
};

const complexToolState = (): Partial<ToolBuilderState> => {
  const tool = createComplexTool();
  return { tool, selectedCommand: tool.commands[0] };
};

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

function findActionButtons(container: Element): HTMLButtonElement[] {
  return Array.from(container.querySelectorAll("button")).filter(
    (btn) =>
      btn.classList.contains("opacity-0") && btn.classList.contains("group-hover:opacity-100"),
  ) as HTMLButtonElement[];
}

function findDeleteButton(container: Element): HTMLButtonElement | undefined {
  return Array.from(container.querySelectorAll("button")).find((btn) => {
    const svg = btn.querySelector("svg");
    return svg && svg.classList.contains("text-destructive");
  }) as HTMLButtonElement | undefined;
}

function getRootTrigger(): Element {
  const triggers = document.querySelectorAll("[data-radix-collection-item]");
  return triggers[0];
}

function getChevron(trigger: Element): Element {
  return trigger.querySelector("[role='button']")!;
}

function getTriggerFor(name: string): Element {
  const elements = screen.getAllByText(name);
  for (const el of elements) {
    const trigger = el.closest("[data-radix-collection-item]") || el.closest("[role='button']");
    if (trigger && !trigger.classList.contains("font-medium")) return trigger;
  }
  const textEl = elements[0];
  return (textEl.closest("[data-radix-collection-item]") || textEl.closest("[role='button']"))!;
}

describe("CommandTree", () => {
  describe("Basic Rendering Tests", () => {
    it("renders the tool name as the root node", () => {
      renderWithProvider(<CommandTree />, simpleTestState);
      expect(screen.getAllByText("test-tool").length).toBeGreaterThanOrEqual(1);
    });

    it("renders command hierarchy correctly", () => {
      renderWithProvider(<CommandTree />, complexToolState());
      expect(screen.getAllByText("my-cli-tool").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("config")).toBeInTheDocument();
      expect(screen.getByText("data")).toBeInTheDocument();
      expect(screen.getByText("utils")).toBeInTheDocument();
      expect(screen.getByText("help")).toBeInTheDocument();
    });

    it("renders action buttons on command nodes", () => {
      renderWithProvider(<CommandTree />, complexToolState());
      const configTrigger = getTriggerFor("config");
      const actions = findActionButtons(configTrigger);
      expect(actions.length).toBeGreaterThan(0);
    });

    it("does not show delete button on root node", () => {
      renderWithProvider(<CommandTree />, complexToolState());
      const rootTrigger = getRootTrigger();
      const deleteBtn = findDeleteButton(rootTrigger);
      expect(deleteBtn).toBeUndefined();
    });

    it("shows delete button on command nodes", () => {
      renderWithProvider(<CommandTree />, complexToolState());
      const helpTrigger = getTriggerFor("help");
      const deleteBtn = findDeleteButton(helpTrigger);
      expect(deleteBtn).toBeDefined();
    });
  });

  describe("Command Tree Structure Tests", () => {
    it("renders subcommands when parent is expanded", async () => {
      renderWithProvider(<CommandTree />, complexToolState());

      const configTrigger = getTriggerFor("config");
      fireEvent.click(getChevron(configTrigger));

      await waitFor(() => {
        expect(screen.getByText("get")).toBeInTheDocument();
        expect(screen.getByText("set")).toBeInTheDocument();
        expect(screen.getByText("list")).toBeInTheDocument();
      });
    });

    it("hides subcommands when parent is collapsed", async () => {
      renderWithProvider(<CommandTree />, complexToolState());

      const configTrigger = getTriggerFor("config");
      fireEvent.click(getChevron(configTrigger));
      await waitFor(() => {
        expect(screen.getByText("get")).toBeInTheDocument();
      });

      fireEvent.click(getChevron(configTrigger));
      await waitFor(() => {
        expect(screen.queryByText("get")).not.toBeInTheDocument();
      });
    });
  });

  describe("Interaction Tests", () => {
    it("clicking a command selects it", () => {
      renderWithProvider(<CommandTree />, complexToolState());
      expect(capturedCtx.selectedCommand?.name).toBe("my-cli-tool");

      fireEvent.click(screen.getByText("config"));
      expect(capturedCtx.selectedCommand?.name).toBe("config");
    });

    it("clicking the root node sets selectedCommand to null", () => {
      renderWithProvider(<CommandTree />, complexToolState());
      expect(capturedCtx.selectedCommand?.name).toBe("my-cli-tool");

      const rootTrigger = getRootTrigger();
      fireEvent.click(rootTrigger);
      expect(capturedCtx.selectedCommand).toBeNull();
    });

    it("clicking edit button opens command dialog", async () => {
      renderWithProvider(<CommandTree />, complexToolState());

      const configTrigger = getTriggerFor("config");
      const actions = findActionButtons(configTrigger);
      const editButton = actions[1];

      fireEvent.click(editButton);
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.getByText("Edit Command Settings")).toBeInTheDocument();
      });
    });

    it("clicking add button on a command opens dialog for new subcommand", async () => {
      renderWithProvider(<CommandTree />, complexToolState());

      const configTrigger = getTriggerFor("config");
      const actions = findActionButtons(configTrigger);
      const addButton = actions[2];

      fireEvent.click(addButton);
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Add Command" })).toBeInTheDocument();
      });
    });

    it("clicking delete button removes the command", () => {
      renderWithProvider(<CommandTree />, complexToolState());
      const initialCommandCount = capturedCtx.tool.commands.length;

      const helpTrigger = getTriggerFor("help");
      const deleteButton = findDeleteButton(helpTrigger);
      expect(deleteButton).toBeDefined();

      fireEvent.click(deleteButton!);
      expect(capturedCtx.tool.commands.length).toBeLessThan(initialCommandCount);
      expect(screen.queryByText("help")).not.toBeInTheDocument();
    });

    it("clicking root add button opens dialog for new root-level command", async () => {
      renderWithProvider(<CommandTree />, complexToolState());

      const rootTrigger = getRootTrigger();
      const actions = findActionButtons(rootTrigger);
      const addButton = actions[0];

      fireEvent.click(addButton);
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Add Command" })).toBeInTheDocument();
      });
    });

    it("handles multiple levels of nesting correctly", async () => {
      renderWithProvider(<CommandTree />, complexToolState());

      const configTrigger = getTriggerFor("config");
      fireEvent.click(getChevron(configTrigger));
      await waitFor(() => {
        expect(screen.getByText("get")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("get"));
      expect(capturedCtx.selectedCommand?.name).toBe("get");
      expect(capturedCtx.selectedCommand?.parentCommandKey).toBe("config");
    });
  });

  describe("State Management Tests", () => {
    it("updates selected command in context when clicking a command", () => {
      renderWithProvider(<CommandTree />, complexToolState());
      expect(capturedCtx.selectedCommand?.name).toBe("my-cli-tool");

      fireEvent.click(screen.getByText("config"));
      expect(capturedCtx.selectedCommand?.name).toBe("config");
      expect(capturedCtx.selectedCommand?.parentCommandKey).toBe("my-cli-tool");
    });

    it("clicking edit opens dialog pre-filled with command details", async () => {
      renderWithProvider(<CommandTree />, complexToolState());

      const configTrigger = getTriggerFor("config");
      const actions = findActionButtons(configTrigger);
      const editButton = actions[1];

      fireEvent.click(editButton);
      await waitFor(() => {
        expect(screen.getByText("Edit Command Settings")).toBeInTheDocument();
        const nameInput = screen.getByLabelText("Command Name") as HTMLInputElement;
        expect(nameInput.value).toBe("config");
      });
    });

    it("opens dialog when adding new command", async () => {
      renderWithProvider(<CommandTree />, complexToolState());

      const rootTrigger = getRootTrigger();
      const actions = findActionButtons(rootTrigger);
      fireEvent.click(actions[0]);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Add Command" })).toBeInTheDocument();
      });
    });

    it("opens dialog when adding subcommand", async () => {
      renderWithProvider(<CommandTree />, complexToolState());

      const configTrigger = getTriggerFor("config");
      const actions = findActionButtons(configTrigger);
      const addButton = actions[2];

      fireEvent.click(addButton);
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Add Command" })).toBeInTheDocument();
      });
    });

    it("saves subcommand with correct parentCommandKey when added via + button", async () => {
      renderWithProvider(<CommandTree />, complexToolState());
      const initialCount = capturedCtx.tool.commands.length;

      const configTrigger = getTriggerFor("config");
      const actions = findActionButtons(configTrigger);
      const addButton = actions[2];

      fireEvent.click(addButton);
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText("Command Name") as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: "new-sub" } });

      const saveButton = screen.getByRole("button", { name: "Add" });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(capturedCtx.tool.commands.length).toBe(initialCount + 1);
      });

      const newCmd = capturedCtx.tool.commands.find((c) => c.name === "new-sub");
      expect(newCmd).toBeDefined();
      expect(newCmd!.parentCommandKey).toBe("config");
    });

    it("disables save when subcommand name matches parent command name", async () => {
      renderWithProvider(<CommandTree />, complexToolState());

      const configTrigger = getTriggerFor("config");
      const actions = findActionButtons(configTrigger);
      const addButton = actions[2];

      fireEvent.click(addButton);
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText("Command Name") as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: "config" } });

      const saveButton = screen.getByRole("button", { name: "Add" });
      expect(saveButton).toBeDisabled();
      expect(
        screen.getByText("A command with this name already exists at this level."),
      ).toBeInTheDocument();
    });

    it("disables save when subcommand name matches an existing sibling", async () => {
      renderWithProvider(<CommandTree />, complexToolState());

      const configTrigger = getTriggerFor("config");
      fireEvent.click(getChevron(configTrigger));
      await waitFor(() => {
        expect(screen.getByText("get")).toBeInTheDocument();
      });

      const actions = findActionButtons(configTrigger);
      const addButton = actions[2];

      fireEvent.click(addButton);
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText("Command Name") as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: "get" } });

      const saveButton = screen.getByRole("button", { name: "Add" });
      expect(saveButton).toBeDisabled();
      expect(
        screen.getByText("A command with this name already exists at this level."),
      ).toBeInTheDocument();
    });

    it("clears dialog inputs after closing and reopening", async () => {
      renderWithProvider(<CommandTree />, complexToolState());

      const rootTrigger = getRootTrigger();
      const rootActions = findActionButtons(rootTrigger);
      const addButton = rootActions[0];

      fireEvent.click(addButton);
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText("Command Name") as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: "some-command" } });
      expect(nameInput.value).toBe("some-command");

      const descInput = screen.getByLabelText("Description") as HTMLTextAreaElement;
      fireEvent.change(descInput, { target: { value: "some description" } });

      fireEvent.click(screen.getByRole("button", { name: "Add" }));
      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });

      fireEvent.click(addButton);
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      const newNameInput = screen.getByLabelText("Command Name") as HTMLInputElement;
      const newDescInput = screen.getByLabelText("Description") as HTMLTextAreaElement;
      expect(newNameInput.value).toBe("");
      expect(newDescInput.value).toBe("");
    });

    it("removes commands from context when deleting", () => {
      renderWithProvider(<CommandTree />, complexToolState());
      const initialCommandCount = capturedCtx.tool.commands.length;
      expect(capturedCtx.tool.commands.find((cmd) => cmd.name === "help")).toBeDefined();

      const helpTrigger = getTriggerFor("help");
      const deleteButton = findDeleteButton(helpTrigger);
      expect(deleteButton).toBeDefined();

      fireEvent.click(deleteButton!);
      expect(capturedCtx.tool.commands.length).toBe(initialCommandCount - 1);
      expect(capturedCtx.tool.commands.find((cmd) => cmd.name === "help")).toBeUndefined();
    });

    it("updates selected command when current selection is deleted", () => {
      const initialState = complexToolState();
      const helpCmd = initialState.tool!.commands.find((c) => c.name === "help")!;
      renderWithProvider(<CommandTree />, { ...initialState, selectedCommand: helpCmd });

      expect(capturedCtx.selectedCommand?.name).toBe("help");

      const helpTrigger = getTriggerFor("help");
      const deleteButton = findDeleteButton(helpTrigger);
      expect(deleteButton).toBeDefined();

      fireEvent.click(deleteButton!);
      expect(capturedCtx.selectedCommand?.name).toBe("my-cli-tool");
    });

    it("responds to external context changes", async () => {
      renderWithProvider(<CommandTree />, complexToolState());
      expect(screen.getAllByText("my-cli-tool").length).toBeGreaterThanOrEqual(1);

      const dataCommand = capturedCtx.tool.commands.find((cmd) => cmd.name === "data");
      if (dataCommand) {
        act(() => {
          capturedCtx.setSelectedCommand(dataCommand);
        });

        await waitFor(() => {
          expect(screen.getAllByText("my-cli-tool").length).toBeGreaterThanOrEqual(1);
          expect(screen.getByText("data")).toBeInTheDocument();
        });
      }
    });

    it("handles command hierarchy changes correctly", async () => {
      renderWithProvider(<CommandTree />, complexToolState());

      const currentCommands = capturedCtx.tool.commands;
      const newCommand: Command = {
        key: "new-test-command-id",
        name: "new-test-command",
        parentCommandKey: "config",
        description: "A new test command",
        sortOrder: 10,
      };

      act(() => {
        capturedCtx.updateTool({ commands: [...currentCommands, newCommand] });
      });

      const configTrigger = getTriggerFor("config");
      fireEvent.click(getChevron(configTrigger));

      await waitFor(() => {
        expect(screen.getByText("new-test-command")).toBeInTheDocument();
      });
    });

    it("handles rapid context changes correctly", async () => {
      renderWithProvider(<CommandTree />, complexToolState());
      const commands = capturedCtx.tool.commands;
      const configCommand = commands.find((cmd) => cmd.name === "config")!;
      const dataCommand = commands.find((cmd) => cmd.name === "data")!;
      const utilsCommand = commands.find((cmd) => cmd.name === "utils")!;

      act(() => {
        capturedCtx.setSelectedCommand(configCommand);
        capturedCtx.setSelectedCommand(dataCommand);
        capturedCtx.setSelectedCommand(utilsCommand);
      });

      await waitFor(() => {
        expect(capturedCtx.selectedCommand?.name).toBe("utils");
      });

      expect(screen.getByText("utils")).toBeInTheDocument();
    });
  });

  describe("Edge Cases Tests", () => {
    it("handles deep nesting of commands", async () => {
      const complexTool = createComplexTool();
      const deepTool: Tool = {
        ...complexTool,
        commands: [
          ...complexTool.commands,
          {
            key: "01979f84-addd-754c-8e0a-ef8bd967d51d",
            name: "level3",
            parentCommandKey: "get",
            description: "Level 3 command",
            sortOrder: 0,
          },
          {
            key: "01979f84-ade1-723b-a8c1-e442b3a14d6a",
            name: "level4",
            parentCommandKey: "01979f84-addd-754c-8e0a-ef8bd967d51d",
            description: "Level 4 command",
            sortOrder: 0,
          },
        ],
      };

      renderWithProvider(<CommandTree />, {
        tool: deepTool,
        selectedCommand: deepTool.commands[0],
      });

      fireEvent.click(getChevron(getTriggerFor("config")));
      await waitFor(() => {
        expect(screen.getByText("get")).toBeInTheDocument();
      });

      fireEvent.click(getChevron(getTriggerFor("get")));
      await waitFor(() => {
        expect(screen.getByText("level3")).toBeInTheDocument();
      });

      fireEvent.click(getChevron(getTriggerFor("level3")));
      await waitFor(() => {
        expect(screen.getByText("level4")).toBeInTheDocument();
      });
    });

    it("maintains state correctly after command deletion", () => {
      const initialState = complexToolState();
      const helpCmd = initialState.tool!.commands.find((c) => c.name === "help")!;
      renderWithProvider(<CommandTree />, { ...initialState, selectedCommand: helpCmd });

      expect(capturedCtx.selectedCommand?.name).toBe("help");

      const helpTrigger = getTriggerFor("help");
      const deleteButton = findDeleteButton(helpTrigger);
      expect(deleteButton).toBeDefined();

      fireEvent.click(deleteButton!);
      expect(capturedCtx.selectedCommand?.name).toBe("my-cli-tool");
      expect(screen.queryByText("help")).not.toBeInTheDocument();
    });

    it("handles empty command list gracefully", () => {
      const tool = defaultTool("empty-tool", "Empty Tool");
      renderWithProvider(<CommandTree />, {
        tool,
        selectedCommand: null,
      });

      expect(screen.getByText("empty-tool")).toBeInTheDocument();
    });

    it("handles invalid command hierarchies gracefully", () => {
      const complexTool = createComplexTool();
      const brokenTool: Tool = {
        ...complexTool,
        commands: [
          {
            key: "root-id",
            name: "root",
            description: "Root command",
            sortOrder: 0,
          },
          {
            key: "orphan-id",
            name: "orphan",
            parentCommandKey: "non-existent-parent",
            description: "Orphaned command",
            sortOrder: 1,
          },
        ],
      };

      expect(() =>
        renderWithProvider(<CommandTree />, {
          tool: brokenTool,
          selectedCommand: brokenTool.commands[0],
        }),
      ).not.toThrow();

      expect(screen.getByText("root")).toBeInTheDocument();
    });

    it("preserves expansion state when opening add command dialog", async () => {
      renderWithProvider(<CommandTree />, complexToolState());

      const configTrigger = getTriggerFor("config");
      fireEvent.click(getChevron(configTrigger));
      await waitFor(() => {
        expect(screen.getByText("get")).toBeInTheDocument();
      });

      const rootTrigger = getRootTrigger();
      const rootActions = findActionButtons(rootTrigger);
      fireEvent.click(rootActions[0]);

      expect(screen.getByText("get")).toBeInTheDocument();
      expect(screen.getByText("set")).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    });
  });

  describe("Drag and Drop Tests", () => {
    it("renders drag handle for non-root commands", () => {
      renderWithProvider(<CommandTree />, complexToolState());
      const helpTrigger = getTriggerFor("help");
      const actions = findActionButtons(helpTrigger);
      // grip + edit + add + delete = 4 buttons for non-root leaf commands
      expect(actions.length).toBeGreaterThanOrEqual(3);
    });

    it("does not render drag handle for the root node", () => {
      renderWithProvider(<CommandTree />, complexToolState());
      const rootTrigger = getRootTrigger();
      const actions = findActionButtons(rootTrigger);
      // Root only has Add button (no grip, no edit, no delete)
      expect(actions).toHaveLength(1);
    });

    it("renders drag handle for subcommands", async () => {
      renderWithProvider(<CommandTree />, complexToolState());
      const configTrigger = getTriggerFor("config");
      fireEvent.click(getChevron(configTrigger));
      await waitFor(() => {
        expect(screen.getByText("get")).toBeInTheDocument();
      });
      const getTrigger = getTriggerFor("get");
      const actions = findActionButtons(getTrigger);
      expect(actions.length).toBeGreaterThanOrEqual(3);
    });

    it("reorderCommands updates sortOrder in context", () => {
      renderWithProvider(<CommandTree />, complexToolState());
      expect(typeof capturedCtx.reorderCommands).toBe("function");

      const rootChildren = capturedCtx.tool.commands.filter(
        (c) => c.parentCommandKey === "my-cli-tool",
      );
      const reversedKeys = [...rootChildren].reverse().map((c) => c.key);

      act(() => {
        capturedCtx.reorderCommands(reversedKeys, "my-cli-tool");
      });

      const updated = capturedCtx.tool.commands.filter(
        (c) => c.parentCommandKey === "my-cli-tool",
      );
      const first = updated.find((c) => c.sortOrder === 0);
      expect(first?.key).toBe(reversedKeys[0]);
    });
  });
});
