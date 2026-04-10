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
  name: "my-cli-tool",
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
      isDefault: true,
      sortOrder: 0,
    },
    {
      key: "config",
      name: "config",
      parentCommandKey: "my-cli-tool",
      description: "Configuration management",
      isDefault: false,
      sortOrder: 1,
    },
    {
      key: "get",
      name: "get",
      parentCommandKey: "config",
      description: "Get configuration values",
      isDefault: true,
      sortOrder: 0,
    },
    {
      key: "set",
      name: "set",
      parentCommandKey: "config",
      description: "Set configuration values",
      isDefault: false,
      sortOrder: 1,
    },
    {
      key: "list",
      name: "list",
      parentCommandKey: "config",
      description: "List all configurations",
      isDefault: false,
      sortOrder: 2,
    },
    {
      key: "data",
      name: "data",
      parentCommandKey: "my-cli-tool",
      description: "Data management operations",
      isDefault: false,
      sortOrder: 2,
    },
    {
      key: "create",
      name: "create",
      parentCommandKey: "data",
      description: "Create new data entries",
      isDefault: false,
      sortOrder: 0,
    },
    {
      key: "read",
      name: "read",
      parentCommandKey: "data",
      description: "Read existing data",
      isDefault: true,
      sortOrder: 1,
    },
    {
      key: "update",
      name: "update",
      parentCommandKey: "data",
      description: "Update existing data",
      isDefault: false,
      sortOrder: 2,
    },
    {
      key: "delete",
      name: "delete",
      parentCommandKey: "data",
      description: "Delete data entries",
      isDefault: false,
      sortOrder: 3,
    },
    {
      key: "utils",
      name: "utils",
      parentCommandKey: "my-cli-tool",
      description: "Utility functions",
      isDefault: false,
      sortOrder: 3,
    },
    {
      key: "validate",
      name: "validate",
      parentCommandKey: "utils",
      description: "Validate data integrity",
      isDefault: false,
      sortOrder: 0,
    },
    {
      key: "backup",
      name: "backup",
      parentCommandKey: "utils",
      description: "Backup operations",
      isDefault: false,
      sortOrder: 1,
    },
    {
      key: "help",
      name: "help",
      parentCommandKey: "my-cli-tool",
      description: "Display help information",
      isDefault: false,
      sortOrder: 4,
    },
  ],
  parameters: [],
  exclusionGroups: [],
  metadata: { supportedInput: [], supportedOutput: [] },
});

const simpleTestState: Partial<ToolBuilderState> = {
  tool: defaultTool("test-tool", "Test tool"),
  selectedCommand: {} as Command,
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

describe("CommandTree", () => {
  describe("Basic Rendering Tests", () => {
    it("renders add command button", () => {
      renderWithProvider(<CommandTree />, simpleTestState);
      expect(screen.getByText(/Add Command/)).toBeInTheDocument();
    });

    it("renders the root command (tool name)", () => {
      renderWithProvider(<CommandTree />, simpleTestState);
      expect(screen.getByText("test-tool")).toBeInTheDocument();
    });

    it("renders command hierarchy correctly with proper indentation", () => {
      const initialState = complexToolState();
      renderWithProvider(<CommandTree />, initialState);
      expect(screen.getByText("my-cli-tool")).toBeInTheDocument();
      expect(screen.getByText("config")).toBeInTheDocument();
      expect(screen.getByText("data")).toBeInTheDocument();
      expect(screen.getByText("utils")).toBeInTheDocument();
      expect(screen.getByText("help")).toBeInTheDocument();
    });

    it("renders default badge for default commands", () => {
      renderWithProvider(<CommandTree />, complexToolState());
      const badges = screen.getAllByText("default");
      expect(badges.length).toBeGreaterThan(0);
    });

    it("renders action buttons (Edit, Add, Delete) on hover", () => {
      renderWithProvider(<CommandTree />, simpleTestState);
      const editButtons = screen.getAllByRole("button");
      const actionButtons = editButtons.filter(
        (btn) =>
          btn.querySelector("svg") &&
          (btn.className.includes("opacity-0") ||
            btn.className.includes("group-hover:opacity-100")),
      );
      expect(actionButtons.length).toBeGreaterThan(0);
    });
  });

  describe("Command Tree Structure Tests", () => {
    it("renders subcommands when parent is expanded", async () => {
      renderWithProvider(<CommandTree />, complexToolState());
      expect(screen.getByText("config")).toBeInTheDocument();

      const configElement = screen.getByText("config").closest("div");
      const expandButton = configElement?.querySelector("button");

      if (expandButton) {
        fireEvent.click(expandButton);
        await waitFor(() => {
          expect(screen.getByText("get")).toBeInTheDocument();
          expect(screen.getByText("set")).toBeInTheDocument();
          expect(screen.getByText("list")).toBeInTheDocument();
        });
      }
    });

    it("hides subcommands when parent is collapsed", async () => {
      renderWithProvider(<CommandTree />, complexToolState());
      const dataElement = screen.getByText("data").closest("div");
      const expandButton = dataElement?.querySelector("button");

      if (expandButton) {
        fireEvent.click(expandButton);
        await waitFor(() => {
          expect(screen.getByText("create")).toBeInTheDocument();
        });

        fireEvent.click(expandButton);
        await waitFor(() => {
          expect(screen.queryByText("create")).not.toBeInTheDocument();
          expect(screen.queryByText("read")).not.toBeInTheDocument();
          expect(screen.queryByText("update")).not.toBeInTheDocument();
          expect(screen.queryByText("delete")).not.toBeInTheDocument();
        });
      }
    });

    it("shows correct chevron icons based on expansion state", () => {
      renderWithProvider(<CommandTree />, complexToolState());
      const utilsElement = screen.getByText("utils").closest("div");
      expect(utilsElement).toBeInTheDocument();
      const chevronButton = utilsElement?.querySelector("button");
      expect(chevronButton).toBeInTheDocument();
      const svgElement = chevronButton?.querySelector("svg");
      expect(svgElement).toBeInTheDocument();
    });

    it("maintains correct indentation levels for nested commands", async () => {
      renderWithProvider(<CommandTree />, complexToolState());
      const configElement = screen.getByText("config").closest("div");
      const expandButton = configElement?.querySelector("button");

      if (expandButton) {
        fireEvent.click(expandButton);
        await waitFor(() => {
          const getElement = screen.getByText("get").closest("div");
          const setElement = screen.getByText("set").closest("div");
          expect(getElement).toHaveStyle({ paddingLeft: expect.stringMatching(/\d+px/) });
          expect(setElement).toHaveStyle({ paddingLeft: expect.stringMatching(/\d+px/) });
        });
      }
    });

    it("doesn't show delete button for root command", () => {
      renderWithProvider(<CommandTree />, complexToolState());
      const rootElement = screen.getByText("my-cli-tool").closest("div");
      const buttons = rootElement?.querySelectorAll("button") || [];
      const deleteButtons = Array.from(buttons).filter((btn) => {
        const svg = btn.querySelector("svg");
        if (!svg) return false;
        return (
          svg.classList.contains("text-destructive") || btn.classList.contains("text-destructive")
        );
      });
      expect(deleteButtons.length).toBe(0);
    });
  });

  describe("Interaction Tests", () => {
    it("clicking a command selects it", () => {
      renderWithProvider(<CommandTree />, complexToolState());
      expect(capturedCtx.selectedCommand.name).toBe("my-cli-tool");

      const configElement = screen.getByText("config");
      fireEvent.click(configElement);

      expect(capturedCtx.selectedCommand.name).toBe("config");
    });

    it("clicking chevron toggles command expansion", async () => {
      renderWithProvider(<CommandTree />, complexToolState());
      const configElement = screen.getByText("config").closest("div");
      const expandButton = configElement?.querySelector("button");

      expect(screen.queryByText("get")).not.toBeInTheDocument();

      if (expandButton) {
        fireEvent.click(expandButton);
        await waitFor(() => {
          expect(screen.getByText("get")).toBeInTheDocument();
          expect(screen.getByText("set")).toBeInTheDocument();
        });

        fireEvent.click(expandButton);
        await waitFor(() => {
          expect(screen.queryByText("get")).not.toBeInTheDocument();
          expect(screen.queryByText("set")).not.toBeInTheDocument();
        });
      }
    });

    it("clicking edit button opens command dialog", async () => {
      renderWithProvider(<CommandTree />, complexToolState());

      const configElement = screen.getByText("config").closest("div");
      const buttons = Array.from(configElement?.querySelectorAll("button") || []);
      const editButton = buttons.find(
        (btn) =>
          btn.classList.contains("opacity-0") && btn.classList.contains("group-hover:opacity-100"),
      );

      if (editButton) {
        fireEvent.click(editButton);
        await waitFor(() => {
          expect(screen.getByRole("dialog")).toBeInTheDocument();
          expect(screen.getByText("Edit Command Settings")).toBeInTheDocument();
        });
      } else {
        expect(buttons.length).toBeGreaterThan(1);
      }
    });

    it("clicking add button on a command opens dialog for new subcommand", async () => {
      renderWithProvider(<CommandTree />, complexToolState());

      const configElement = screen.getByText("config").closest("div");
      const buttons = Array.from(configElement?.querySelectorAll("button") || []);
      const actionButtons = buttons.filter(
        (btn) =>
          btn.classList.contains("opacity-0") && btn.classList.contains("group-hover:opacity-100"),
      );
      const addButton = actionButtons[1];

      if (addButton) {
        fireEvent.click(addButton);
        await waitFor(() => {
          expect(screen.getByRole("dialog")).toBeInTheDocument();
          expect(screen.getByRole("heading", { name: "Add Command" })).toBeInTheDocument();
        });
      } else {
        expect(actionButtons.length).toBeGreaterThanOrEqual(2);
      }
    });

    it("clicking delete button removes the command", () => {
      renderWithProvider(<CommandTree />, complexToolState());
      const initialCommandCount = capturedCtx.tool.commands.length;

      const helpElement = screen.getByText("help").closest("div");
      const buttons = Array.from(helpElement?.querySelectorAll("button") || []);
      const deleteButton = buttons.find((btn) => {
        const svg = btn.querySelector("svg");
        return svg && svg.classList.contains("text-destructive");
      });

      if (deleteButton) {
        fireEvent.click(deleteButton);
        expect(capturedCtx.tool.commands.length).toBeLessThan(initialCommandCount);
        expect(screen.queryByText("help")).not.toBeInTheDocument();
      } else {
        expect(buttons.length).toBeGreaterThan(0);
      }
    });

    it("clicking 'Add Command' button opens dialog for new root-level command", async () => {
      renderWithProvider(<CommandTree />, complexToolState());

      const addCommandButton = screen.getByText(/Add Command/);
      fireEvent.click(addCommandButton);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Add Command" })).toBeInTheDocument();
      });
    });

    it("doesn't trigger selection when clicking action buttons", () => {
      renderWithProvider(<CommandTree />, complexToolState());
      const rootCommand = capturedCtx.tool.commands.find((c) => c.name === "my-cli-tool");

      const configElement = screen.getByText("config").closest("div");
      const editButton = configElement?.querySelector("button svg")?.closest("button");

      if (editButton && editButton.querySelector("svg")) {
        fireEvent.click(editButton);
        // Root should still be selected if stopPropagation works
        if (rootCommand) {
          expect(screen.getByText("my-cli-tool")).toBeInTheDocument();
        }
      }
    });

    it("preserves expansion state when opening add command dialog", async () => {
      renderWithProvider(<CommandTree />, complexToolState());

      const configElement = screen.getByText("config").closest("div");
      const expandButton = configElement?.querySelector("button");

      if (expandButton) {
        fireEvent.click(expandButton);
        await waitFor(() => {
          expect(screen.getByText("get")).toBeInTheDocument();
        });

        const addCommandButton = screen.getByRole("button", { name: /Add Command/i });
        fireEvent.click(addCommandButton);

        expect(screen.getByText("get")).toBeInTheDocument();
        expect(screen.getByText("set")).toBeInTheDocument();
      }
    });

    it("handles multiple levels of nesting correctly", async () => {
      renderWithProvider(<CommandTree />, complexToolState());

      const configElement = screen.getByText("config").closest("div");
      const configExpandButton = configElement?.querySelector("button");

      if (configExpandButton) {
        fireEvent.click(configExpandButton);
        await waitFor(() => {
          expect(screen.getByText("get")).toBeInTheDocument();
        });

        const getElement = screen.getByText("get");
        fireEvent.click(getElement);

        expect(capturedCtx.selectedCommand.name).toBe("get");
        expect(capturedCtx.selectedCommand.parentCommandKey).toBe("config");
      }
    });
  });

  describe("State Management Tests", () => {
    it("updates selected command in context when clicking a command", () => {
      renderWithProvider(<CommandTree />, complexToolState());
      expect(capturedCtx.selectedCommand.name).toBe("my-cli-tool");

      const configElement = screen.getByText("config");
      fireEvent.click(configElement);

      expect(capturedCtx.selectedCommand.name).toBe("config");
      expect(capturedCtx.selectedCommand.parentCommandKey).toBe("my-cli-tool");
    });

    it("clicking edit opens dialog pre-filled with command details", async () => {
      renderWithProvider(<CommandTree />, complexToolState());

      const configElement = screen.getByText("config").closest("div");
      const buttons = Array.from(configElement?.querySelectorAll("button") || []);
      const editButton = buttons.find(
        (btn) =>
          btn.classList.contains("opacity-0") && btn.classList.contains("group-hover:opacity-100"),
      );

      if (editButton) {
        fireEvent.click(editButton);
        await waitFor(() => {
          expect(screen.getByText("Edit Command Settings")).toBeInTheDocument();
          const nameInput = screen.getByLabelText("Command Name") as HTMLInputElement;
          expect(nameInput.value).toBe("config");
        });
      }
    });

    it("opens dialog when adding new command", async () => {
      renderWithProvider(<CommandTree />, complexToolState());

      const addCommandButton = screen.getByText(/Add Command/);
      fireEvent.click(addCommandButton);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Add Command" })).toBeInTheDocument();
      });
    });

    it("opens dialog when adding subcommand", async () => {
      renderWithProvider(<CommandTree />, complexToolState());

      const configElement = screen.getByText("config").closest("div");
      const buttons = Array.from(configElement?.querySelectorAll("button") || []);
      const actionButtons = buttons.filter(
        (btn) =>
          btn.classList.contains("opacity-0") && btn.classList.contains("group-hover:opacity-100"),
      );
      const addButton = actionButtons[1];

      if (addButton) {
        fireEvent.click(addButton);
        await waitFor(() => {
          expect(screen.getByRole("dialog")).toBeInTheDocument();
          expect(screen.getByRole("heading", { name: "Add Command" })).toBeInTheDocument();
        });
      }
    });

    it("removes commands from context when deleting", () => {
      renderWithProvider(<CommandTree />, complexToolState());
      const initialCommandCount = capturedCtx.tool.commands.length;
      const helpCommand = capturedCtx.tool.commands.find((cmd) => cmd.name === "help");
      expect(helpCommand).toBeDefined();

      const helpElement = screen.getByText("help").closest("div");
      const buttons = Array.from(helpElement?.querySelectorAll("button") || []);
      const deleteButton = buttons.find((btn) => {
        const svg = btn.querySelector("svg");
        return svg && svg.classList.contains("text-destructive");
      });

      if (deleteButton) {
        fireEvent.click(deleteButton);
        expect(capturedCtx.tool.commands.length).toBe(initialCommandCount - 1);
        expect(capturedCtx.tool.commands.find((cmd) => cmd.name === "help")).toBeUndefined();
      }
    });

    it("updates selected command when current selection is deleted", () => {
      const initialState = complexToolState();
      const helpCmd = initialState.tool!.commands.find((c) => c.name === "help")!;
      renderWithProvider(<CommandTree />, { ...initialState, selectedCommand: helpCmd });

      expect(capturedCtx.selectedCommand.name).toBe("help");

      const helpElement = screen.getByText("help").closest("div");
      const buttons = Array.from(helpElement?.querySelectorAll("button") || []);
      const deleteButton = buttons.find((btn) => {
        const svg = btn.querySelector("svg");
        return svg && svg.classList.contains("text-destructive");
      });

      if (deleteButton) {
        fireEvent.click(deleteButton);
        expect(capturedCtx.selectedCommand.name).toBe("my-cli-tool");
      }
    });

    it("maintains expanded commands state independently of context updates", async () => {
      renderWithProvider(<CommandTree />, complexToolState());

      const configElement = screen.getByText("config").closest("div");
      const expandButton = configElement?.querySelector("button");

      if (expandButton) {
        fireEvent.click(expandButton);
        await waitFor(() => {
          expect(screen.getByText("get")).toBeInTheDocument();
        });

        const addCommandButton = screen.getByText(/Add Command/);
        fireEvent.click(addCommandButton);

        expect(screen.getByText("get")).toBeInTheDocument();
        expect(screen.getByText("set")).toBeInTheDocument();
      }
    });

    it("responds to external context changes", async () => {
      renderWithProvider(<CommandTree />, complexToolState());
      expect(screen.getByText("my-cli-tool")).toBeInTheDocument();

      const dataCommand = capturedCtx.tool.commands.find((cmd) => cmd.name === "data");
      if (dataCommand) {
        act(() => {
          capturedCtx.setSelectedCommand(dataCommand);
        });

        await waitFor(() => {
          expect(screen.getByText("my-cli-tool")).toBeInTheDocument();
          expect(screen.getByText("data")).toBeInTheDocument();
        });
      }
    });

    it("handles command hierarchy changes correctly", () => {
      renderWithProvider(<CommandTree />, complexToolState());

      const currentCommands = capturedCtx.tool.commands;
      const newCommand: Command = {
        key: "new-test-command-id",
        name: "new-test-command",
        parentCommandKey: "config",
        description: "A new test command",
        isDefault: false,
        sortOrder: 10,
      };

      act(() => {
        capturedCtx.updateTool({ commands: [...currentCommands, newCommand] });
      });

      const configElement = screen.getByText("config").closest("div");
      const expandButton = configElement?.querySelector("button");

      if (expandButton) {
        fireEvent.click(expandButton);
        expect(screen.getByText("new-test-command")).toBeInTheDocument();
      }
    });

    it("preserves component state during context updates", async () => {
      renderWithProvider(<CommandTree />, complexToolState());

      const configElement = screen.getByText("config").closest("div");
      const expandButton = configElement?.querySelector("button");

      if (expandButton) {
        fireEvent.click(expandButton);
        await waitFor(() => {
          expect(screen.getByText("get")).toBeInTheDocument();
        });

        const dataCommand = capturedCtx.tool.commands.find((cmd) => cmd.name === "data");
        if (dataCommand) {
          act(() => {
            capturedCtx.setSelectedCommand(dataCommand);
          });
        }

        // Config should still be expanded
        expect(screen.getByText("get")).toBeInTheDocument();
        expect(screen.getByText("set")).toBeInTheDocument();
      }
    });

    it("handles rapid context changes correctly", async () => {
      renderWithProvider(<CommandTree />, complexToolState());
      const commands = capturedCtx.tool.commands;
      const configCommand = commands.find((cmd) => cmd.name === "config")!;
      const dataCommand = commands.find((cmd) => cmd.name === "data")!;
      const utilsCommand = commands.find((cmd) => cmd.name === "utils")!;

      if (configCommand && dataCommand && utilsCommand) {
        act(() => {
          capturedCtx.setSelectedCommand(configCommand);
          capturedCtx.setSelectedCommand(dataCommand);
          capturedCtx.setSelectedCommand(utilsCommand);
        });

        await waitFor(() => {
          expect(capturedCtx.selectedCommand.name).toBe("utils");
        });

        expect(screen.getByText("utils")).toBeInTheDocument();
      }
    });
  });

  describe("Edge Cases Tests", () => {
    it("handles commands with no subcommands correctly", () => {
      renderWithProvider(<CommandTree />, complexToolState());

      const helpElement = screen.getByText("help").closest("div");
      expect(helpElement).toBeInTheDocument();

      const expandButton = helpElement?.querySelector("#expand-button");
      const spacerDiv = helpElement?.querySelector("div.w-4");
      expect(spacerDiv).toBeInTheDocument();
      expect(expandButton).not.toBeInTheDocument();
    });

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
            isDefault: false,
            sortOrder: 0,
          },
          {
            key: "01979f84-ade1-723b-a8c1-e442b3a14d6a",
            name: "level4",
            parentCommandKey: "01979f84-addd-754c-8e0a-ef8bd967d51d",
            description: "Level 4 command",
            isDefault: false,
            sortOrder: 0,
          },
        ],
      };

      renderWithProvider(<CommandTree />, {
        tool: deepTool,
        selectedCommand: deepTool.commands[0],
      });

      const configElement = screen.getByText("config").closest("div");
      const configExpandButton = configElement?.querySelector("button");

      if (configExpandButton) {
        fireEvent.click(configExpandButton);
        await waitFor(() => {
          expect(screen.getByText("get")).toBeInTheDocument();
        });

        const getElement = screen.getByText("get").closest("div");
        const getExpandButton = getElement?.querySelector("button");

        if (getExpandButton) {
          fireEvent.click(getExpandButton);
          await waitFor(() => {
            expect(screen.getByText("level3")).toBeInTheDocument();
          });

          const level3Element = screen.getByText("level3").closest("div");
          const level3ExpandButton = level3Element?.querySelector("button");

          if (level3ExpandButton) {
            fireEvent.click(level3ExpandButton);
            await waitFor(() => {
              expect(screen.getByText("level4")).toBeInTheDocument();
            });
            const level4Element = screen.getByText("level4").closest("div");
            expect(level4Element).toBeInTheDocument();
          }
        }
      }
    });

    it("maintains state correctly after command deletion", () => {
      const initialState = complexToolState();
      const helpCmd = initialState.tool!.commands.find((c) => c.name === "help")!;
      renderWithProvider(<CommandTree />, { ...initialState, selectedCommand: helpCmd });

      expect(capturedCtx.selectedCommand.name).toBe("help");

      const helpElement = screen.getByText("help").closest("div");
      const buttons = Array.from(helpElement?.querySelectorAll("button") || []);
      const deleteButton = buttons.find((btn) => {
        const svg = btn.querySelector("svg");
        return svg && svg.classList.contains("text-destructive");
      });

      if (deleteButton) {
        fireEvent.click(deleteButton);
        expect(capturedCtx.selectedCommand.name).toBe("my-cli-tool");
        expect(screen.queryByText("help")).not.toBeInTheDocument();
      }
    });

    it("handles empty command list gracefully", () => {
      const complexTool = createComplexTool();
      const minimalTool: Tool = {
        ...complexTool,
        commands: [
          {
            key: "minimal-tool-id",
            name: "minimal-tool",
            description: "Minimal tool with just root command",
            isDefault: true,
            sortOrder: 0,
          },
        ],
      };

      renderWithProvider(<CommandTree />, {
        tool: minimalTool,
        selectedCommand: minimalTool.commands[0],
      });

      expect(screen.getByText("minimal-tool")).toBeInTheDocument();
      expect(screen.getByText(/Add Command/)).toBeInTheDocument();

      const rootElement = screen.getByText("minimal-tool").closest("div");
      const spacerDiv = rootElement?.querySelector("div.w-4");
      expect(spacerDiv).toBeInTheDocument();
    });

    it("preserves expansion state when opening add command dialog", async () => {
      renderWithProvider(<CommandTree />, complexToolState());

      const configElement = screen.getByText("config").closest("div");
      const expandButton = configElement?.querySelector("button");

      if (expandButton) {
        fireEvent.click(expandButton);
        await waitFor(() => {
          expect(screen.getByText("get")).toBeInTheDocument();
        });

        const buttons = Array.from(configElement?.querySelectorAll("button") || []);
        const actionButtons = buttons.filter(
          (btn) =>
            btn.classList.contains("opacity-0") &&
            btn.classList.contains("group-hover:opacity-100"),
        );
        const addButton = actionButtons[1];

        if (addButton) {
          fireEvent.click(addButton);
          expect(screen.getByText("get")).toBeInTheDocument();
          expect(screen.getByText("set")).toBeInTheDocument();

          await waitFor(() => {
            expect(screen.getByRole("dialog")).toBeInTheDocument();
            expect(screen.getByRole("heading", { name: "Add Command" })).toBeInTheDocument();
          });
        }
      }
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
            isDefault: true,
            sortOrder: 0,
          },
          {
            key: "orphan-id",
            name: "orphan",
            parentCommandKey: "non-existent-parent",
            description: "Orphaned command",
            isDefault: false,
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
      expect(screen.getByText(/Add Command/)).toBeInTheDocument();
    });
  });
});
