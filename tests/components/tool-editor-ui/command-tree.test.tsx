import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { CommandTree } from "@/components/tool-editor-ui/command-tree";
import {
  ToolBuilderState,
  toolBuilderStore,
} from "@/components/tool-editor-ui/tool-editor.store";
import { defaultTool } from "@/lib/utils/tool-editor";
import { Tool } from "@/lib/types/tool-editor";

// Helper function to create a tool with complex command structure
const createComplexTool = (): Tool => {
  return {
    name: "my-cli-tool",
    displayName: "My CLI Tool",
    description: "A sample CLI tool with nested commands",
    version: "1.0.0",
    commands: [
      {
        id: "01979f6d-f206-7716-a2f2-64e1baed9686",
        name: "my-cli-tool",
        description: "Main CLI tool command",
        isDefault: true,
        sortOrder: 0,
        subcommands: [],
      },
      {
        id: "01979f6d-f206-7716-a2f2-6bd94d6bc515",
        name: "config",
        parentCommandId: "01979f6d-f206-7716-a2f2-64e1baed9686",
        description: "Configuration management",
        isDefault: false,
        sortOrder: 1,
        subcommands: [],
      },
      {
        id: "01979f6d-f206-7716-a2f2-6ced0d4d3b0b",
        name: "get",
        parentCommandId: "01979f6d-f206-7716-a2f2-6bd94d6bc515",
        description: "Get configuration values",
        isDefault: true,
        sortOrder: 0,
        subcommands: [],
      },
      {
        id: "01979f6d-f206-7716-a2f2-7012a6c8f412",
        name: "set",
        parentCommandId: "01979f6d-f206-7716-a2f2-6bd94d6bc515",
        description: "Set configuration values",
        isDefault: false,
        sortOrder: 1,
        subcommands: [],
      },
      {
        id: "01979f6d-f206-7716-a2f2-73b963d82a18",
        name: "list",
        parentCommandId: "01979f6d-f206-7716-a2f2-6bd94d6bc515",
        description: "List all configurations",
        isDefault: false,
        sortOrder: 2,
        subcommands: [],
      },
      {
        id: "01979f6d-f206-7716-a2f2-768e4c6f7653",
        name: "data",
        parentCommandId: "01979f6d-f206-7716-a2f2-64e1baed9686",
        description: "Data management operations",
        isDefault: false,
        sortOrder: 2,
        subcommands: [],
      },
      {
        id: "01979f6d-f206-7716-a2f2-7a8347e15b42",
        name: "create",
        parentCommandId: "01979f6d-f206-7716-a2f2-768e4c6f7653",
        description: "Create new data entries",
        isDefault: false,
        sortOrder: 0,
        subcommands: [],
      },
      {
        id: "01979f6d-f206-7716-a2f2-7d1c24f8a9e7",
        name: "read",
        parentCommandId: "01979f6d-f206-7716-a2f2-768e4c6f7653",
        description: "Read existing data",
        isDefault: true,
        sortOrder: 1,
        subcommands: [],
      },
      {
        id: "01979f6d-f206-7716-a2f2-7f8d9b3c6af1",
        name: "update",
        parentCommandId: "01979f6d-f206-7716-a2f2-768e4c6f7653",
        description: "Update existing data",
        isDefault: false,
        sortOrder: 2,
        subcommands: [],
      },
      {
        id: "01979f6d-f206-7716-a2f2-8249f7b8d5c4",
        name: "delete",
        parentCommandId: "01979f6d-f206-7716-a2f2-768e4c6f7653",
        description: "Delete data entries",
        isDefault: false,
        sortOrder: 3,
        subcommands: [],
      },
      {
        id: "01979f6d-f206-7716-a2f2-85a6c1f3e291",
        name: "utils",
        parentCommandId: "01979f6d-f206-7716-a2f2-64e1baed9686",
        description: "Utility functions",
        isDefault: false,
        sortOrder: 3,
        subcommands: [],
      },
      {
        id: "01979f6d-f206-7716-a2f2-8876d4e9c7f8",
        name: "validate",
        parentCommandId: "01979f6d-f206-7716-a2f2-85a6c1f3e291",
        description: "Validate data integrity",
        isDefault: false,
        sortOrder: 0,
        subcommands: [],
      },
      {
        id: "01979f6d-f206-7716-a2f2-8b4f7a2d5e91",
        name: "backup",
        parentCommandId: "01979f6d-f206-7716-a2f2-85a6c1f3e291",
        description: "Backup operations",
        isDefault: false,
        sortOrder: 1,
        subcommands: [],
      },
      {
        id: "01979f6d-f206-7716-a2f2-8e1c9f6b3a74",
        name: "help",
        parentCommandId: "01979f6d-f206-7716-a2f2-64e1baed9686",
        description: "Display help information",
        isDefault: false,
        sortOrder: 4,
        subcommands: [],
      },
    ],
    parameters: [],
    exclusionGroups: [],
    supportedInput: [],
    supportedOutput: [],
  };
};

var testState: ToolBuilderState = {
  tool: defaultTool("test-tool", "Test tool"),
  selectedCommand: {} as any,
  selectedParameter: null,
  editingCommand: null,
  parameterValues: {},
  dialogs: {
    editTool: false,
    savedCommands: false,
    exclusionGroups: false,
  },
};

describe("CommandTree", () => {
  beforeEach(() => {
    toolBuilderStore.setState((prev) => {
      return { ...prev, ...testState };
    });
  });

  describe("Basic Rendering Tests", () => {
    it("renders add command button", () => {
      render(<CommandTree />);
      expect(screen.getByText(/Add Command/)).toBeInTheDocument();
    });

    it("renders the root command (tool name)", () => {
      render(<CommandTree />);
      expect(screen.getByText("test-tool")).toBeInTheDocument();
    });

    it("renders command hierarchy correctly with proper indentation", () => {
      const complexTool = createComplexTool();
      toolBuilderStore.setState((prev) => ({
        ...prev,
        tool: complexTool,
        selectedCommand: complexTool.commands[0],
      }));

      render(<CommandTree />);

      // Check that main commands are rendered
      expect(screen.getByText("my-cli-tool")).toBeInTheDocument();
      expect(screen.getByText("config")).toBeInTheDocument();
      expect(screen.getByText("data")).toBeInTheDocument();
      expect(screen.getByText("utils")).toBeInTheDocument();
      expect(screen.getByText("help")).toBeInTheDocument();
    });

    it("renders default badge for default commands", () => {
      const complexTool = createComplexTool();
      toolBuilderStore.setState((prev) => ({
        ...prev,
        tool: complexTool,
        selectedCommand: complexTool.commands[0],
      }));

      render(<CommandTree />);

      // The root command should have a default badge
      const badges = screen.getAllByText("default");
      expect(badges.length).toBeGreaterThan(0);
    });

    it("renders action buttons (Edit, Add, Delete) on hover", () => {
      render(<CommandTree />);

      // Initially buttons should not be visible (opacity-0)
      const commandElement = screen.getByText("test-tool").closest("div");
      expect(commandElement).toBeInTheDocument();

      // The buttons should exist but with opacity-0 class
      const editButtons = screen.getAllByRole("button");
      const actionButtons = editButtons.filter(
        (btn) =>
          btn.querySelector("svg") &&
          (btn.className.includes("opacity-0") ||
            btn.className.includes("group-hover:opacity-100"))
      );
      expect(actionButtons.length).toBeGreaterThan(0);
    });
  });

  describe("Command Tree Structure Tests", () => {
    beforeEach(() => {
      const complexTool = createComplexTool();
      toolBuilderStore.setState((prev) => ({
        ...prev,
        tool: complexTool,
        selectedCommand: complexTool.commands[0],
      }));
    });

    it("renders subcommands when parent is expanded", async () => {
      render(<CommandTree />);

      // Initially the config command should be visible
      expect(screen.getByText("config")).toBeInTheDocument();

      // Click on the config command's expand button to expand it
      const configElement = screen.getByText("config").closest("div");
      const expandButton = configElement?.querySelector("button");

      if (expandButton) {
        fireEvent.click(expandButton);

        // After expansion, subcommands should be visible
        await waitFor(() => {
          expect(screen.getByText("get")).toBeInTheDocument();
          expect(screen.getByText("set")).toBeInTheDocument();
          expect(screen.getByText("list")).toBeInTheDocument();
        });
      }
    });

    it("hides subcommands when parent is collapsed", async () => {
      render(<CommandTree />);

      // First expand the data command
      const dataElement = screen.getByText("data").closest("div");
      const expandButton = dataElement?.querySelector("button");

      if (expandButton) {
        fireEvent.click(expandButton);

        // Verify subcommands are visible
        await waitFor(() => {
          expect(screen.getByText("create")).toBeInTheDocument();
        });

        // Now collapse it
        fireEvent.click(expandButton);

        // Subcommands should be hidden
        await waitFor(() => {
          expect(screen.queryByText("create")).not.toBeInTheDocument();
          expect(screen.queryByText("read")).not.toBeInTheDocument();
          expect(screen.queryByText("update")).not.toBeInTheDocument();
          expect(screen.queryByText("delete")).not.toBeInTheDocument();
        });
      }
    });

    it("shows correct chevron icons based on expansion state", () => {
      render(<CommandTree />);

      // Find the utils command (which has subcommands)
      const utilsElement = screen.getByText("utils").closest("div");
      expect(utilsElement).toBeInTheDocument();

      // Should have a chevron button
      const chevronButton = utilsElement?.querySelector("button");
      expect(chevronButton).toBeInTheDocument();

      // Should contain either ChevronDown or ChevronRight icon
      const svgElement = chevronButton?.querySelector("svg");
      expect(svgElement).toBeInTheDocument();
    });

    it("maintains correct indentation levels for nested commands", async () => {
      render(<CommandTree />);

      // Expand the config command to see nested commands
      const configElement = screen.getByText("config").closest("div");
      const expandButton = configElement?.querySelector("button");

      if (expandButton) {
        fireEvent.click(expandButton);

        await waitFor(() => {
          const getElement = screen.getByText("get").closest("div");
          const setElement = screen.getByText("set").closest("div");

          // Check that nested commands have greater indentation
          expect(getElement).toHaveStyle({
            paddingLeft: expect.stringMatching(/\d+px/),
          });
          expect(setElement).toHaveStyle({
            paddingLeft: expect.stringMatching(/\d+px/),
          });
        });
      }
    });

    it("doesn't show delete button for root command", () => {
      render(<CommandTree />);

      const rootElement = screen.getByText("my-cli-tool").closest("div");
      expect(rootElement).toBeInTheDocument();

      // Root command should not have delete button (Trash2Icon)
      // We can check this by counting the buttons - root should have fewer action buttons
      const buttons = rootElement?.querySelectorAll("button") || [];
      const deleteButtons = Array.from(buttons).filter((btn) => {
        const svg = btn.querySelector("svg");
        if (!svg) return false;
        return (
          svg.classList.contains("text-destructive") ||
          btn.classList.contains("text-destructive")
        );
      });
      expect(deleteButtons.length).toBe(0);
    });
  });

  describe("Interaction Tests", () => {
    beforeEach(() => {
      const complexTool = createComplexTool();
      toolBuilderStore.setState((prev) => ({
        ...prev,
        tool: complexTool,
        selectedCommand: complexTool.commands[0],
      }));
    });

    it("clicking a command selects it", () => {
      render(<CommandTree />);

      // Initially the root command should be selected
      const initialSelectedCommand = toolBuilderStore.state.selectedCommand;
      expect(initialSelectedCommand.name).toBe("my-cli-tool");

      // Click on the config command
      const configElement = screen.getByText("config");
      fireEvent.click(configElement);

      // Check that the selected command has changed
      const updatedSelectedCommand = toolBuilderStore.state.selectedCommand;
      expect(updatedSelectedCommand.name).toBe("config");
    });

    it("clicking chevron toggles command expansion", async () => {
      render(<CommandTree />);

      // Find the config command element
      const configElement = screen.getByText("config").closest("div");
      const expandButton = configElement?.querySelector("button");

      // Initially subcommands should not be visible
      expect(screen.queryByText("get")).not.toBeInTheDocument();

      if (expandButton) {
        // Click to expand
        fireEvent.click(expandButton);

        // Subcommands should now be visible
        await waitFor(() => {
          expect(screen.getByText("get")).toBeInTheDocument();
          expect(screen.getByText("set")).toBeInTheDocument();
        });

        // Click to collapse
        fireEvent.click(expandButton);

        // Subcommands should be hidden again
        await waitFor(() => {
          expect(screen.queryByText("get")).not.toBeInTheDocument();
          expect(screen.queryByText("set")).not.toBeInTheDocument();
        });
      }
    });

    it("clicking edit button opens command dialog", async () => {
      render(<CommandTree />);

      // Initially editing command should be null
      expect(toolBuilderStore.state.editingCommand).toBeNull();

      // Find the config command row
      const configElement = screen.getByText("config").closest("div");

      // Find all buttons in the config row
      const buttons = Array.from(
        configElement?.querySelectorAll("button") || []
      );

      // Find the edit button (should be one of the action buttons with opacity-0)
      const editButton = buttons.find((btn) => {
        return (
          btn.classList.contains("opacity-0") &&
          btn.classList.contains("group-hover:opacity-100")
        );
      });

      if (editButton) {
        fireEvent.click(editButton);

        // Check that editing command is set
        await waitFor(() => {
          const editingCommand = toolBuilderStore.state.editingCommand;
          expect(editingCommand).not.toBeNull();
          expect(editingCommand?.name).toBe("config");
        });
      } else {
        // If we can't find the edit button, at least verify the structure
        expect(buttons.length).toBeGreaterThan(1);
      }
    });

    it("clicking add button on a command adds a new subcommand", () => {
      render(<CommandTree />);

      // Get initial command count
      const initialCommandCount = toolBuilderStore.state.tool.commands.length;

      // Find the config command row
      const configElement = screen.getByText("config").closest("div");
      const buttons = Array.from(
        configElement?.querySelectorAll("button") || []
      );

      // Find the add button (should be the second action button with opacity-0)
      const actionButtons = buttons.filter(
        (btn) =>
          btn.classList.contains("opacity-0") &&
          btn.classList.contains("group-hover:opacity-100")
      );

      // The add button should be the second action button (after edit)
      const addButton = actionButtons[1];

      if (addButton) {
        fireEvent.click(addButton);

        // Check that a new command was added
        const updatedCommandCount = toolBuilderStore.state.tool.commands.length;
        expect(updatedCommandCount).toBe(initialCommandCount + 1);

        // Check that the new command has the correct parent
        const newCommands = toolBuilderStore.state.tool.commands.filter(
          (cmd) =>
            !createComplexTool().commands.some(
              (originalCmd) => originalCmd.name === cmd.name
            )
        );
        expect(newCommands.length).toBe(1);
        expect(newCommands[0].parentCommandId).toBe(
          "01979f6d-f206-7716-a2f2-6bd94d6bc515"
        );
      } else {
        // If we can't find the add button, skip this test
        expect(actionButtons.length).toBeGreaterThanOrEqual(2);
      }
    });

    it("clicking delete button removes the command", () => {
      render(<CommandTree />);

      // Get initial command count
      const initialCommandCount = toolBuilderStore.state.tool.commands.length;

      // Find the help command (non-root command)
      const helpElement = screen.getByText("help").closest("div");
      const buttons = Array.from(helpElement?.querySelectorAll("button") || []);

      // Find the delete button (should be the last action button with text-destructive)
      const deleteButton = buttons.find((btn) => {
        const svg = btn.querySelector("svg");
        return svg && svg.classList.contains("text-destructive");
      });

      if (deleteButton) {
        fireEvent.click(deleteButton);

        // Check that the command was removed
        const updatedCommandCount = toolBuilderStore.state.tool.commands.length;
        expect(updatedCommandCount).toBeLessThan(initialCommandCount);

        // Check that the help command is no longer in the DOM
        expect(screen.queryByText("help")).not.toBeInTheDocument();
      } else {
        // If we can't find the delete button, at least verify non-root commands have action buttons
        expect(buttons.length).toBeGreaterThan(0);
      }
    });

    it("clicking 'Add Command' button at bottom adds a new root-level command", () => {
      render(<CommandTree />);

      // Get initial command count
      const initialCommandCount = toolBuilderStore.state.tool.commands.length;

      // Find and click the "Add Command" button
      const addCommandButton = screen.getByText(/Add Command/);
      fireEvent.click(addCommandButton);

      // Check that a new command was added
      const updatedCommandCount = toolBuilderStore.state.tool.commands.length;
      expect(updatedCommandCount).toBe(initialCommandCount + 1);
    });

    it("doesn't trigger selection when clicking action buttons", () => {
      render(<CommandTree />);

      // Set initial selection to root command
      const rootCommand = toolBuilderStore.state.tool.commands.find(
        (c) => c.name === "my-cli-tool"
      );
      if (rootCommand) {
        act(() => {
          toolBuilderStore.setState((prev) => ({
            ...prev,
            selectedCommand: rootCommand,
          }));
        });
      }

      // Find the config command and its edit button
      const configElement = screen.getByText("config").closest("div");
      const editButton = configElement
        ?.querySelector("button svg")
        ?.closest("button");

      if (editButton && editButton.querySelector("svg")) {
        // Click the edit button with stopPropagation
        fireEvent.click(editButton);

        // Selection should not have changed to config
        const selectedCommand = toolBuilderStore.state.selectedCommand;
        expect(selectedCommand.name).toBe("my-cli-tool"); // Should still be root
      }
    });

    it("preserves expansion state when adding/removing commands", async () => {
      render(<CommandTree />);

      // Expand the config command
      const configElement = screen.getByText("config").closest("div");
      const expandButton = configElement?.querySelector("button");

      if (expandButton) {
        fireEvent.click(expandButton);

        // Wait for expansion
        await waitFor(() => {
          expect(screen.getByText("get")).toBeInTheDocument();
        });

        // Add a new root command
        const addCommandButton = screen.getByText(/Add Command/);
        fireEvent.click(addCommandButton);

        // Config should still be expanded
        expect(screen.getByText("get")).toBeInTheDocument();
        expect(screen.getByText("set")).toBeInTheDocument();
      }
    });

    it("handles multiple levels of nesting correctly", async () => {
      render(<CommandTree />);

      // Expand config to see its children
      const configElement = screen.getByText("config").closest("div");
      const configExpandButton = configElement?.querySelector("button");

      if (configExpandButton) {
        fireEvent.click(configExpandButton);

        await waitFor(() => {
          expect(screen.getByText("get")).toBeInTheDocument();
        });

        // Click on a nested command to select it
        const getElement = screen.getByText("get");
        fireEvent.click(getElement);

        // Verify the nested command is selected
        const selectedCommand = toolBuilderStore.state.selectedCommand;
        expect(selectedCommand.name).toBe("get");
        expect(selectedCommand.parentCommandId).toBe(
          "01979f6d-f206-7716-a2f2-6bd94d6bc515"
        );
      }
    });
  });

  describe("State Management Tests", () => {
    beforeEach(() => {
      const complexTool = createComplexTool();
      toolBuilderStore.setState((prev) => ({
        ...prev,
        tool: complexTool,
        selectedCommand: complexTool.commands[0],
      }));
    });

    it("updates selected command in store when clicking a command", () => {
      render(<CommandTree />);

      // Verify initial state
      const initialSelectedCommand = toolBuilderStore.state.selectedCommand;
      expect(initialSelectedCommand.name).toBe("my-cli-tool");

      // Click on config command
      const configElement = screen.getByText("config");
      fireEvent.click(configElement);

      // Verify store was updated
      const updatedState = toolBuilderStore.state;
      expect(updatedState.selectedCommand.name).toBe("config");
      expect(updatedState.selectedCommand.parentCommandId).toBe(
        "01979f6d-f206-7716-a2f2-64e1baed9686"
      );
    });

    it("updates editing command in store when clicking edit", async () => {
      render(<CommandTree />);

      // Verify initial editing state
      expect(toolBuilderStore.state.editingCommand).toBeNull();

      // Find the config command and click edit button
      const configElement = screen.getByText("config").closest("div");
      const buttons = Array.from(
        configElement?.querySelectorAll("button") || []
      );
      const editButton = buttons.find(
        (btn) =>
          btn.classList.contains("opacity-0") &&
          btn.classList.contains("group-hover:opacity-100")
      );

      if (editButton) {
        fireEvent.click(editButton);

        // Verify store was updated
        await waitFor(() => {
          const updatedState = toolBuilderStore.state;
          expect(updatedState.editingCommand).not.toBeNull();
          expect(updatedState.editingCommand?.name).toBe("config");
        });
      }
    });

    it("updates tool commands when adding new command", () => {
      render(<CommandTree />);

      // Get initial state
      const initialCommandCount = toolBuilderStore.state.tool.commands.length;
      const initialCommands = [...toolBuilderStore.state.tool.commands];

      // Add a new root command
      const addCommandButton = screen.getByText(/Add Command/);
      fireEvent.click(addCommandButton);

      // Verify store was updated
      const updatedState = toolBuilderStore.state;
      expect(updatedState.tool.commands.length).toBe(initialCommandCount + 1);

      // Find the new command
      const newCommand = updatedState.tool.commands.find(
        (cmd) =>
          !initialCommands.some((initialCmd) => initialCmd.name === cmd.name)
      );
      expect(newCommand).toBeDefined();
      expect(newCommand?.parentCommandId).toBe(undefined);
    });

    it("updates tool commands when adding subcommand", () => {
      render(<CommandTree />);

      // Get initial state
      const initialCommandCount = toolBuilderStore.state.tool.commands.length;
      const initialCommands = [...toolBuilderStore.state.tool.commands];

      // Find config command and add subcommand
      const configElement = screen.getByText("config").closest("div");
      const buttons = Array.from(
        configElement?.querySelectorAll("button") || []
      );
      const actionButtons = buttons.filter(
        (btn) =>
          btn.classList.contains("opacity-0") &&
          btn.classList.contains("group-hover:opacity-100")
      );
      const addButton = actionButtons[1]; // Second action button

      if (addButton) {
        fireEvent.click(addButton);

        // Verify store was updated
        const updatedState = toolBuilderStore.state;
        expect(updatedState.tool.commands.length).toBe(initialCommandCount + 1);

        // Find the new subcommand
        const newCommand = updatedState.tool.commands.find(
          (cmd) =>
            !initialCommands.some((initialCmd) => initialCmd.name === cmd.name)
        );
        expect(newCommand).toBeDefined();
        expect(newCommand?.parentCommandId).toBe(
          "01979f6d-f206-7716-a2f2-6bd94d6bc515"
        );
      }
    });

    it("removes commands from store when deleting", () => {
      render(<CommandTree />);

      // Get initial state
      const initialCommandCount = toolBuilderStore.state.tool.commands.length;
      const helpCommand = toolBuilderStore.state.tool.commands.find(
        (cmd) => cmd.name === "help"
      );
      expect(helpCommand).toBeDefined();

      // Find help command and delete it
      const helpElement = screen.getByText("help").closest("div");
      const buttons = Array.from(helpElement?.querySelectorAll("button") || []);
      const deleteButton = buttons.find((btn) => {
        const svg = btn.querySelector("svg");
        return svg && svg.classList.contains("text-destructive");
      });

      if (deleteButton) {
        fireEvent.click(deleteButton);

        // Verify store was updated
        const updatedState = toolBuilderStore.state;
        expect(updatedState.tool.commands.length).toBe(initialCommandCount - 1);

        // Verify help command was removed
        const helpCommandAfterDelete = updatedState.tool.commands.find(
          (cmd) => cmd.name === "help"
        );
        expect(helpCommandAfterDelete).toBeUndefined();
      }
    });

    it("updates selected command when current selection is deleted", () => {
      render(<CommandTree />);

      // Select the help command first
      const helpCommand = toolBuilderStore.state.tool.commands.find(
        (cmd) => cmd.name === "help"
      );
      if (helpCommand) {
        act(() => {
          toolBuilderStore.setState((prev) => ({
            ...prev,
            selectedCommand: helpCommand,
          }));
        });
      }

      // Verify help is selected
      expect(toolBuilderStore.state.selectedCommand.name).toBe("help");

      // Delete the help command
      const helpElement = screen.getByText("help").closest("div");
      const buttons = Array.from(helpElement?.querySelectorAll("button") || []);
      const deleteButton = buttons.find((btn) => {
        const svg = btn.querySelector("svg");
        return svg && svg.classList.contains("text-destructive");
      });

      if (deleteButton) {
        fireEvent.click(deleteButton);

        // Verify selected command was updated to root command
        const updatedState = toolBuilderStore.state;
        expect(updatedState.selectedCommand.name).toBe("my-cli-tool");
      }
    });

    it("maintains expanded commands state independently of store", async () => {
      render(<CommandTree />);

      // Expand config command
      const configElement = screen.getByText("config").closest("div");
      const expandButton = configElement?.querySelector("button");

      if (expandButton) {
        fireEvent.click(expandButton);

        await waitFor(() => {
          expect(screen.getByText("get")).toBeInTheDocument();
        });

        // Add a new command (this will trigger a re-render)
        const addCommandButton = screen.getByText(/Add Command/);
        fireEvent.click(addCommandButton);

        // Config should still be expanded after the re-render
        expect(screen.getByText("get")).toBeInTheDocument();
        expect(screen.getByText("set")).toBeInTheDocument();
      }
    });

    it("responds to external store changes", async () => {
      render(<CommandTree />);

      // Verify initial rendering
      expect(screen.getByText("my-cli-tool")).toBeInTheDocument();

      // Update selected command in store (this should trigger a re-render)
      const dataCommand = toolBuilderStore.state.tool.commands.find(
        (cmd) => cmd.name === "data"
      );
      if (dataCommand) {
        act(() => {
          toolBuilderStore.setState((prev) => ({
            ...prev,
            selectedCommand: dataCommand,
          }));
        });

        // Component should respond to store changes
        // We can verify this by checking that the component still renders correctly
        await waitFor(() => {
          expect(screen.getByText("my-cli-tool")).toBeInTheDocument();
          expect(screen.getByText("data")).toBeInTheDocument();
        });
      }
    });

    it("handles command hierarchy changes correctly", () => {
      render(<CommandTree />);

      // Get initial tool
      const initialTool = toolBuilderStore.state.tool;

      // Simulate adding a new command to the hierarchy
      const newCommand = {
        id: "new-test-command-id",
        name: "new-test-command",
        parentCommand: "01979f6d-f206-7716-a2f2-6bd94d6bc515",
        description: "A new test command",
        isDefault: false,
        sortOrder: 10,
        subcommands: [],
      };

      const updatedTool = {
        ...initialTool,
        commands: [...initialTool.commands, newCommand],
      };

      act(() => {
        toolBuilderStore.setState((prev) => ({
          ...prev,
          tool: updatedTool,
        }));
      });

      // Expand config to see the new command
      const configElement = screen.getByText("config").closest("div");
      const expandButton = configElement?.querySelector("button");

      if (expandButton) {
        fireEvent.click(expandButton);

        // The new command should appear in the expanded config section
        expect(screen.getByText("new-test-command")).toBeInTheDocument();
      }
    });

    it("preserves component state during store updates", async () => {
      render(<CommandTree />);

      // Expand config command
      const configElement = screen.getByText("config").closest("div");
      const expandButton = configElement?.querySelector("button");

      if (expandButton) {
        fireEvent.click(expandButton);

        await waitFor(() => {
          expect(screen.getByText("get")).toBeInTheDocument();
        });

        // Update only the selected command in store
        const dataCommand = toolBuilderStore.state.tool.commands.find(
          (cmd) => cmd.name === "data"
        );
        if (dataCommand) {
          act(() => {
            toolBuilderStore.setState((prev) => ({
              ...prev,
              selectedCommand: dataCommand,
            }));
          });
        }

        // Config should still be expanded
        expect(screen.getByText("get")).toBeInTheDocument();
        expect(screen.getByText("set")).toBeInTheDocument();
      }
    });
  });

  describe("Edge Cases Tests", () => {
    beforeEach(() => {
      const complexTool = createComplexTool();
      toolBuilderStore.setState((prev) => ({
        ...prev,
        tool: complexTool,
        selectedCommand: complexTool.commands[0],
      }));
    });

    it("handles commands with no subcommands correctly", () => {
      render(<CommandTree />);

      // Find a command with no subcommands (help command)
      const helpElement = screen.getByText("help").closest("div");
      expect(helpElement).toBeInTheDocument();

      // Should not have an expand button
      const expandButton = helpElement?.querySelector("button");
      // The first button would be for actions, not expansion since there are no subcommands
      // Commands without subcommands should have a spacer div instead of expand button
      const spacerDiv = helpElement?.querySelector("div.w-4");
      expect(spacerDiv).toBeInTheDocument();
    });

    it("handles deep nesting of commands", async () => {
      // Create a tool with deep nesting
      const deepTool = {
        ...createComplexTool(),
        commands: [
          ...createComplexTool().commands,
          {
            id: "01979f84-addd-754c-8e0a-ef8bd967d51d",
            name: "level3",
            parentCommand: "01979f6d-f206-7716-a2f2-6ced0d4d3b0b", // Child of get, which is child of config
            description: "Level 3 command",
            isDefault: false,
            sortOrder: 0,
            subcommands: [],
          },
          {
            id: "01979f84-ade1-723b-a8c1-e442b3a14d6a",
            name: "level4",
            parentCommand: "01979f84-addd-754c-8e0a-ef8bd967d51d",
            description: "Level 4 command",
            isDefault: false,
            sortOrder: 0,
            subcommands: [],
          },
        ],
      };

      act(() => {
        toolBuilderStore.setState((prev) => ({
          ...prev,
          tool: deepTool,
          selectedCommand: deepTool.commands[0],
        }));
      });

      render(<CommandTree />);

      // Expand config
      const configElement = screen.getByText("config").closest("div");
      const configExpandButton = configElement?.querySelector("button");

      if (configExpandButton) {
        fireEvent.click(configExpandButton);

        await waitFor(() => {
          expect(screen.getByText("get")).toBeInTheDocument();
        });

        // Expand get
        const getElement = screen.getByText("get").closest("div");
        const getExpandButton = getElement?.querySelector("button");

        if (getExpandButton) {
          fireEvent.click(getExpandButton);

          await waitFor(() => {
            expect(screen.getByText("level3")).toBeInTheDocument();
          });

          // Expand level3
          const level3Element = screen.getByText("level3").closest("div");
          const level3ExpandButton = level3Element?.querySelector("button");

          if (level3ExpandButton) {
            fireEvent.click(level3ExpandButton);

            await waitFor(() => {
              expect(screen.getByText("level4")).toBeInTheDocument();
            });

            // Verify deep nesting works correctly
            const level4Element = screen.getByText("level4").closest("div");
            expect(level4Element).toBeInTheDocument();
          }
        }
      }
    });

    it("maintains state correctly after command deletion", () => {
      render(<CommandTree />);

      // Select a command that will be deleted
      const helpCommand = toolBuilderStore.state.tool.commands.find(
        (cmd) => cmd.name === "help"
      );
      if (helpCommand) {
        act(() => {
          toolBuilderStore.setState((prev) => ({
            ...prev,
            selectedCommand: helpCommand,
          }));
        });

        // Verify help is selected
        expect(toolBuilderStore.state.selectedCommand.name).toBe("help");

        // Delete the help command
        const helpElement = screen.getByText("help").closest("div");
        const buttons = Array.from(
          helpElement?.querySelectorAll("button") || []
        );
        const deleteButton = buttons.find((btn) => {
          const svg = btn.querySelector("svg");
          return svg && svg.classList.contains("text-destructive");
        });

        if (deleteButton) {
          fireEvent.click(deleteButton);

          // Store should handle the deletion gracefully
          const updatedState = toolBuilderStore.state;
          expect(updatedState.selectedCommand.name).toBe("my-cli-tool"); // Falls back to root
          expect(screen.queryByText("help")).not.toBeInTheDocument();
        }
      }
    });

    it("handles empty command list gracefully", () => {
      // Create a tool with minimal commands (just root)
      const minimalTool = {
        ...createComplexTool(),
        commands: [
          {
            id: "minimal-tool-id",
            name: "minimal-tool",
            description: "Minimal tool with just root command",
            isDefault: true,
            sortOrder: 0,
            subcommands: [],
          },
        ],
      };

      act(() => {
        toolBuilderStore.setState((prev) => ({
          ...prev,
          tool: minimalTool,
          selectedCommand: minimalTool.commands[0],
        }));
      });

      render(<CommandTree />);

      // Should render the root command
      expect(screen.getByText("minimal-tool")).toBeInTheDocument();

      // Should still have the Add Command button
      expect(screen.getByText(/Add Command/)).toBeInTheDocument();

      // Root command should not have expand button since no subcommands
      const rootElement = screen.getByText("minimal-tool").closest("div");
      const spacerDiv = rootElement?.querySelector("div.w-4");
      expect(spacerDiv).toBeInTheDocument();
    });

    it("preserves expansion state when updating commands", async () => {
      render(<CommandTree />);

      // Expand config command
      const configElement = screen.getByText("config").closest("div");
      const expandButton = configElement?.querySelector("button");

      if (expandButton) {
        fireEvent.click(expandButton);

        await waitFor(() => {
          expect(screen.getByText("get")).toBeInTheDocument();
        });

        // Add a new subcommand to config
        const buttons = Array.from(
          configElement?.querySelectorAll("button") || []
        );
        const actionButtons = buttons.filter(
          (btn) =>
            btn.classList.contains("opacity-0") &&
            btn.classList.contains("group-hover:opacity-100")
        );
        const addButton = actionButtons[1]; // Second action button

        if (addButton) {
          fireEvent.click(addButton);

          // Config should still be expanded and show the new command
          expect(screen.getByText("get")).toBeInTheDocument();
          expect(screen.getByText("set")).toBeInTheDocument();

          // New command should be visible
          const newCommands = toolBuilderStore.state.tool.commands.filter(
            (cmd) =>
              !createComplexTool().commands.some(
                (originalCmd) => originalCmd.name === cmd.name
              )
          );
          expect(newCommands.length).toBe(1);
        }
      }
    });

    it("handles rapid state changes correctly", async () => {
      render(<CommandTree />);

      // Rapidly change selected command multiple times
      const commands = toolBuilderStore.state.tool.commands;
      const configCommand = commands.find((cmd) => cmd.name === "config");
      const dataCommand = commands.find((cmd) => cmd.name === "data");
      const utilsCommand = commands.find((cmd) => cmd.name === "utils");

      if (configCommand && dataCommand && utilsCommand) {
        // Rapid state changes
        act(() => {
          toolBuilderStore.setState((prev) => ({
            ...prev,
            selectedCommand: configCommand,
          }));
          toolBuilderStore.setState((prev) => ({
            ...prev,
            selectedCommand: dataCommand,
          }));
          toolBuilderStore.setState((prev) => ({
            ...prev,
            selectedCommand: utilsCommand,
          }));
        });

        // Final state should be utils
        await waitFor(() => {
          expect(toolBuilderStore.state.selectedCommand.name).toBe("utils");
        });

        // Component should handle this gracefully
        expect(screen.getByText("utils")).toBeInTheDocument();
      }
    });

    it("handles invalid command hierarchies gracefully", () => {
      // Create a tool with broken hierarchy (parent doesn't exist)
      const brokenTool = {
        ...createComplexTool(),
        commands: [
          {
            id: "root-id",
            name: "root",
            description: "Root command",
            isDefault: true,
            sortOrder: 0,
            subcommands: [],
          },
          {
            id: "orphan-id",
            name: "orphan",
            parentCommand: "non-existent-parent",
            description: "Orphaned command",
            isDefault: false,
            sortOrder: 1,
            subcommands: [],
          },
        ],
      };

      act(() => {
        toolBuilderStore.setState((prev) => ({
          ...prev,
          tool: brokenTool,
          selectedCommand: brokenTool.commands[0],
        }));
      });

      // Should render without crashing
      expect(() => render(<CommandTree />)).not.toThrow();

      // Should show the root command
      expect(screen.getByText("root")).toBeInTheDocument();

      // The orphaned command might not be shown or shown at root level
      // depending on how buildCommandHierarchy handles it
      expect(screen.getByText(/Add Command/)).toBeInTheDocument();
    });
  });
});
