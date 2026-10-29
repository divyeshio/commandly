import { defaultTool } from "../test-utils";
import { Command, Tool } from "@/components/commandly/types/tool";
import { findCommand, getAllCommands } from "@/components/commandly/utils/tool";
import { CommandTree } from "@/components/tool-editor/command-tree";
import {
  ToolBuilderProvider,
  ToolBuilderState,
  useToolBuilder,
} from "@/components/tool-editor/tool-editor.context";
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
      displayName: "my-cli-tool",
      description: "Main CLI tool command",
      sortOrder: 0,
      commands: [
        {
          key: "config",
          displayName: "config",
          description: "Configuration management",
          sortOrder: 1,
          commands: [
            {
              key: "get",
              displayName: "get",
              description: "Get configuration values",
              sortOrder: 0,
            },
            {
              key: "set",
              displayName: "set",
              description: "Set configuration values",
              sortOrder: 1,
            },
            {
              key: "list",
              displayName: "list",
              description: "List all configurations",
              sortOrder: 2,
            },
          ],
        },
        {
          key: "data",
          displayName: "data",
          description: "Data management operations",
          sortOrder: 2,
          commands: [
            {
              key: "create",
              displayName: "create",
              description: "Create new data entries",
              sortOrder: 0,
            },
            {
              key: "read",
              displayName: "read",
              description: "Read existing data",
              sortOrder: 1,
            },
            {
              key: "update",
              displayName: "update",
              description: "Update existing data",
              sortOrder: 2,
            },
            {
              key: "delete",
              displayName: "delete",
              description: "Delete data entries",
              sortOrder: 3,
            },
          ],
        },
        {
          key: "utils",
          displayName: "utils",
          description: "Utility functions",
          sortOrder: 3,
          commands: [
            {
              key: "validate",
              displayName: "validate",
              description: "Validate data integrity",
              sortOrder: 0,
            },
            {
              key: "backup",
              displayName: "backup",
              description: "Backup operations",
              sortOrder: 1,
            },
          ],
        },
        {
          key: "help",
          displayName: "help",
          description: "Display help information",
          sortOrder: 4,
        },
      ],
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
      displayName: "test-tool",
      description: "Main command",
      sortOrder: 0,
    },
  ],
};

const simpleTestState: Partial<ToolBuilderState> = {
  tool: simpleTestTool,
  selectedCommandKey: simpleTestTool.commands[0].key,
};

const complexToolState = (): Partial<ToolBuilderState> => {
  const tool = createComplexTool();
  return { tool, selectedCommandKey: tool.commands[0].key };
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

const ACTION_LABEL = /^(Reorder|Edit|Add subcommand to|Delete) /;

function findActionButtons(container: Element): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>("button[aria-label]")).filter((btn) =>
    ACTION_LABEL.test(btn.getAttribute("aria-label") ?? ""),
  );
}

function findDeleteButton(container: Element): HTMLElement | undefined {
  return Array.from(container.querySelectorAll<HTMLElement>("button[aria-label]")).find((btn) =>
    (btn.getAttribute("aria-label") ?? "").startsWith("Delete "),
  );
}

function getRootTrigger(): Element {
  const triggers = document.querySelectorAll("[data-radix-collection-item]");
  return triggers[0];
}

function getChevron(trigger: Element): Element {
  return trigger.querySelector("[role='button']")!;
}

/** The tree item holding this text: the first match in document order. */
function getTriggerFor(name: string): Element {
  const text = screen.getAllByText(name)[0];
  return (text.closest("[data-radix-collection-item]") ?? text.closest("[role='button']"))!;
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
      expect(capturedCtx.selectedCommand?.displayName).toBe("my-cli-tool");

      fireEvent.click(screen.getByText("config"));
      expect(capturedCtx.selectedCommand?.displayName).toBe("config");
    });

    it("clicking the root node sets selectedCommand to null", () => {
      renderWithProvider(<CommandTree />, complexToolState());
      expect(capturedCtx.selectedCommand?.displayName).toBe("my-cli-tool");

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
      const initialCommandCount = getAllCommands(capturedCtx.tool).length;

      const helpTrigger = getTriggerFor("help");
      const deleteButton = findDeleteButton(helpTrigger);
      expect(deleteButton).toBeDefined();

      fireEvent.click(deleteButton!);
      expect(getAllCommands(capturedCtx.tool).length).toBeLessThan(initialCommandCount);
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
      expect(capturedCtx.selectedCommand?.displayName).toBe("get");
      expect(findCommand(capturedCtx.tool, "config")?.commands?.map((c) => c.key)).toContain("get");
    });
  });

  describe("State Management Tests", () => {
    it("updates selected command in context when clicking a command", () => {
      renderWithProvider(<CommandTree />, complexToolState());
      expect(capturedCtx.selectedCommand?.displayName).toBe("my-cli-tool");

      fireEvent.click(screen.getByText("config"));
      expect(capturedCtx.selectedCommand?.displayName).toBe("config");
      expect(capturedCtx.selectedCommand?.key).toBe("config");
    });

    it("clicking edit opens dialog pre-filled with command details", async () => {
      renderWithProvider(<CommandTree />, complexToolState());

      const configTrigger = getTriggerFor("config");
      const actions = findActionButtons(configTrigger);
      const editButton = actions[1];

      fireEvent.click(editButton);
      await waitFor(() => {
        expect(screen.getByText("Edit Command Settings")).toBeInTheDocument();
        const nameInput = screen.getByLabelText("Display Name") as HTMLInputElement;
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

    it("saves subcommand with correct parent when added via + button", async () => {
      renderWithProvider(<CommandTree />, complexToolState());
      const initialCount = getAllCommands(capturedCtx.tool).length;

      const configTrigger = getTriggerFor("config");
      const actions = findActionButtons(configTrigger);
      const addButton = actions[2];

      fireEvent.click(addButton);
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText("Display Name") as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: "new-sub" } });

      const saveButton = screen.getByRole("button", { name: "Add" });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(getAllCommands(capturedCtx.tool).length).toBe(initialCount + 1);
      });

      const newCmd = findCommand(capturedCtx.tool, "new-sub");
      expect(newCmd).toBeDefined();
      expect(findCommand(capturedCtx.tool, "config")?.commands?.map((c) => c.key)).toContain(
        "new-sub",
      );
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

      const nameInput = screen.getByLabelText("Display Name") as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: "config" } });

      const saveButton = screen.getByRole("button", { name: "Add" });
      expect(saveButton).toBeDisabled();
      expect(
        screen.getByText("A command with this key already exists at this level."),
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

      const nameInput = screen.getByLabelText("Display Name") as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: "get" } });

      const saveButton = screen.getByRole("button", { name: "Add" });
      expect(saveButton).toBeDisabled();
      expect(
        screen.getByText("A command with this key already exists at this level."),
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

      const nameInput = screen.getByLabelText("Display Name") as HTMLInputElement;
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

      const newNameInput = screen.getByLabelText("Display Name") as HTMLInputElement;
      const newDescInput = screen.getByLabelText("Description") as HTMLTextAreaElement;
      expect(newNameInput.value).toBe("");
      expect(newDescInput.value).toBe("");
    });

    it("removes commands from context when deleting", () => {
      renderWithProvider(<CommandTree />, complexToolState());
      const initialCommandCount = getAllCommands(capturedCtx.tool).length;
      expect(findCommand(capturedCtx.tool, "help")).toBeDefined();

      const helpTrigger = getTriggerFor("help");
      const deleteButton = findDeleteButton(helpTrigger);
      expect(deleteButton).toBeDefined();

      fireEvent.click(deleteButton!);
      expect(getAllCommands(capturedCtx.tool).length).toBe(initialCommandCount - 1);
      expect(findCommand(capturedCtx.tool, "help")).toBeUndefined();
    });

    it("updates selected command when current selection is deleted", () => {
      const initialState = complexToolState();
      const helpCmd = findCommand(initialState.tool!, "help")!;
      renderWithProvider(<CommandTree />, { ...initialState, selectedCommandKey: helpCmd.key });

      expect(capturedCtx.selectedCommand?.displayName).toBe("help");

      const helpTrigger = getTriggerFor("help");
      const deleteButton = findDeleteButton(helpTrigger);
      expect(deleteButton).toBeDefined();

      fireEvent.click(deleteButton!);
      expect(capturedCtx.selectedCommand?.displayName).toBe("my-cli-tool");
    });

    it("responds to external context changes", async () => {
      renderWithProvider(<CommandTree />, complexToolState());
      expect(screen.getAllByText("my-cli-tool").length).toBeGreaterThanOrEqual(1);

      const dataCommand = findCommand(capturedCtx.tool, "data");
      if (dataCommand) {
        act(() => {
          capturedCtx.setSelectedCommandKey(dataCommand.key);
        });

        await waitFor(() => {
          expect(screen.getAllByText("my-cli-tool").length).toBeGreaterThanOrEqual(1);
          expect(screen.getByText("data")).toBeInTheDocument();
        });
      }
    });

    it("handles command hierarchy changes correctly", async () => {
      renderWithProvider(<CommandTree />, complexToolState());

      const newCommand: Command = {
        key: "new-test-command-id",
        displayName: "new-test-command",
        description: "A new test command",
        sortOrder: 10,
      };

      act(() => {
        capturedCtx.addCommand(newCommand, "config");
      });

      const configTrigger = getTriggerFor("config");
      fireEvent.click(getChevron(configTrigger));

      await waitFor(() => {
        expect(screen.getByText("new-test-command")).toBeInTheDocument();
      });
    });

    it("handles rapid context changes correctly", async () => {
      renderWithProvider(<CommandTree />, complexToolState());
      const configCommand = findCommand(capturedCtx.tool, "config")!;
      const dataCommand = findCommand(capturedCtx.tool, "data")!;
      const utilsCommand = findCommand(capturedCtx.tool, "utils")!;

      act(() => {
        capturedCtx.setSelectedCommandKey(configCommand.key);
        capturedCtx.setSelectedCommandKey(dataCommand.key);
        capturedCtx.setSelectedCommandKey(utilsCommand.key);
      });

      await waitFor(() => {
        expect(capturedCtx.selectedCommand?.displayName).toBe("utils");
      });

      expect(screen.getByText("utils")).toBeInTheDocument();
    });
  });

  describe("Edge Cases Tests", () => {
    it("handles deep nesting of commands", async () => {
      const complexTool = createComplexTool();
      const parent = complexTool.commands[0];
      const siblings = (parent.commands ?? []).filter((c) => c.key !== "config");

      const deepTool: Tool = {
        ...complexTool,
        commands: [
          {
            ...parent,
            commands: [
              ...siblings,
              {
                key: "config",
                displayName: "config",
                description: "Configuration management",
                sortOrder: 1,
                commands: [
                  {
                    key: "get",
                    displayName: "get",
                    description: "Get configuration values",
                    sortOrder: 0,
                    commands: [
                      {
                        key: "level3",
                        displayName: "level3",
                        description: "Level 3 command",
                        sortOrder: 0,
                        commands: [
                          {
                            key: "level4",
                            displayName: "level4",
                            description: "Level 4 command",
                            sortOrder: 0,
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      renderWithProvider(<CommandTree />, {
        tool: deepTool,
        selectedCommandKey: deepTool.commands[0].key,
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
      const helpCmd = findCommand(initialState.tool!, "help")!;
      renderWithProvider(<CommandTree />, { ...initialState, selectedCommandKey: helpCmd.key });

      expect(capturedCtx.selectedCommand?.displayName).toBe("help");

      const helpTrigger = getTriggerFor("help");
      const deleteButton = findDeleteButton(helpTrigger);
      expect(deleteButton).toBeDefined();

      fireEvent.click(deleteButton!);
      expect(capturedCtx.selectedCommand?.displayName).toBe("my-cli-tool");
      expect(screen.queryByText("help")).not.toBeInTheDocument();
    });

    it("handles empty command list gracefully", () => {
      const tool = defaultTool("empty-tool", "Empty Tool");
      renderWithProvider(<CommandTree />, {
        tool,
        selectedCommandKey: null,
      });

      expect(screen.getByText("empty-tool")).toBeInTheDocument();
    });

    it("does not render expansion arrow on root when there are no commands", () => {
      const tool = defaultTool("empty-tool", "Empty Tool");
      renderWithProvider(<CommandTree />, {
        tool,
        selectedCommandKey: null,
      });

      const rootTrigger = getRootTrigger();
      const chevronButton = rootTrigger.querySelector("[data-state]");
      expect(chevronButton).toBeNull();
    });

    it("renders expansion arrow on root when there are commands", () => {
      renderWithProvider(<CommandTree />, complexToolState());

      const rootTrigger = getRootTrigger();
      const chevronButton = rootTrigger.querySelector("[data-state]");
      expect(chevronButton).not.toBeNull();
    });

    it("handles commands with empty subcommand arrays gracefully", () => {
      const complexTool = createComplexTool();
      const emptyTool: Tool = {
        ...complexTool,
        commands: [
          {
            key: "solo",
            displayName: "solo",
            description: "A command with no subcommands",
            sortOrder: 0,
            commands: [],
          },
        ],
      };

      expect(() =>
        renderWithProvider(<CommandTree />, {
          tool: emptyTool,
          selectedCommandKey: emptyTool.commands[0].key,
        }),
      ).not.toThrow();

      expect(screen.getByText("solo")).toBeInTheDocument();
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

      const rootChildren = capturedCtx.tool.commands[0].commands ?? [];
      const reversedKeys = [...rootChildren].reverse().map((c) => c.key);

      act(() => {
        capturedCtx.reorderCommands(reversedKeys, "my-cli-tool");
      });

      const updated = capturedCtx.tool.commands[0].commands ?? [];
      const first = updated.find((c) => c.sortOrder === 0);
      expect(first?.key).toBe(reversedKeys[0]);
    });
  });
});
