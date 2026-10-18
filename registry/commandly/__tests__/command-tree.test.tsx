import { CommandTree } from "../command-tree";
import type { Tool } from "@/components/commandly/types/tool";
import { fireEvent, render, screen } from "@testing-library/react";

const testTool: Tool = {
  binaryName: "mycli",
  displayName: "My CLI",
  commands: [
    {
      key: "config",
      displayName: "config",
      aliases: ["cfg"],
      commands: [
        {
          key: "config-get",
          displayName: "get",
          parameters: [
            {
              key: "key-param",
              displayName: "Key",
              parameterType: "Argument",
              dataType: "String",
              position: 0,
            },
          ],
        },
      ],
    },
    { key: "scan", displayName: "scan" },
  ],
  parameters: [],
};

const setup = (selectedCommand: Tool["commands"][number] | null = null) => {
  const onSelectCommand = vi.fn();
  render(
    <CommandTree
      tool={testTool}
      selectedCommand={selectedCommand}
      onSelectCommand={onSelectCommand}
    />,
  );
  return { onSelectCommand };
};

describe("CommandTree", () => {
  it("renders the root node and nested commands", () => {
    setup();

    expect(screen.getByText("mycli")).toBeInTheDocument();
    expect(screen.getByText("config")).toBeInTheDocument();
    expect(screen.getByText("get")).toBeInTheDocument();
    expect(screen.getByText("scan")).toBeInTheDocument();
  });

  it("selects the root invocation when the root node is clicked", () => {
    const { onSelectCommand } = setup();

    fireEvent.click(screen.getByText("mycli"));

    expect(onSelectCommand).toHaveBeenCalledWith(null);
  });

  it("selects a command when its node is clicked", () => {
    const { onSelectCommand } = setup();

    fireEvent.click(screen.getByText("scan"));

    expect(onSelectCommand).toHaveBeenCalledWith(expect.objectContaining({ key: "scan" }));
  });

  it("selects a nested subcommand when its node is clicked", () => {
    const { onSelectCommand } = setup();

    fireEvent.click(screen.getByText("get"));

    expect(onSelectCommand).toHaveBeenCalledWith(expect.objectContaining({ key: "config-get" }));
  });

  it("collapses and expands a branch when its own row is clicked", () => {
    setup();

    expect(screen.getByText("get")).toBeInTheDocument();

    fireEvent.click(screen.getByText("config"));
    expect(screen.queryByText("get")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("config"));
    expect(screen.getByText("get")).toBeInTheDocument();
  });

  it("points the chevron down while a branch is open and right while it is closed", () => {
    setup();

    const row = () => screen.getByText("config").closest("button")!;
    const chevron = () => row().querySelector("svg")!;

    expect(chevron()).toHaveClass("rotate-90");

    fireEvent.click(row());

    expect(chevron()).not.toHaveClass("rotate-90");
  });

  it("gives a leaf row no chevron to rotate", () => {
    setup();

    expect(screen.getByText("scan").closest("button")!.querySelector("svg")).toBeNull();
  });

  it("indents the row itself, so the gutter beside a row is not inert", () => {
    setup();

    const trigger = screen.getByText("config").closest("button")!;

    expect(trigger.style.paddingLeft).not.toBe("");
  });

  it("filters commands by name when a search query is entered", () => {
    setup();

    fireEvent.change(screen.getByPlaceholderText("Search commands"), {
      target: { value: "scan" },
    });

    expect(screen.getByText("scan")).toBeInTheDocument();
    expect(screen.queryByText("config")).not.toBeInTheDocument();
    expect(screen.queryByText("get")).not.toBeInTheDocument();
  });

  it("filters commands by alias when a search query is entered", () => {
    setup();

    fireEvent.change(screen.getByPlaceholderText("Search commands"), {
      target: { value: "cfg" },
    });

    expect(screen.queryByText("No command found.")).not.toBeInTheDocument();
    expect(screen.getByText("config")).toBeInTheDocument();
    expect(screen.queryByText("get")).not.toBeInTheDocument();
    expect(screen.queryByText("scan")).not.toBeInTheDocument();
  });

  it("finds a nested command by the path it is invoked with", () => {
    setup();

    fireEvent.change(screen.getByPlaceholderText("Search commands"), {
      target: { value: "config get" },
    });

    expect(screen.queryByText("No command found.")).not.toBeInTheDocument();
    expect(screen.getByText("config get")).toBeInTheDocument();
  });

  it("shows an empty state when no command matches", () => {
    setup();

    fireEvent.change(screen.getByPlaceholderText("Search commands"), {
      target: { value: "nothing-matches" },
    });

    expect(screen.getByText("No command found.")).toBeInTheDocument();
  });

  it("shows the parameter count for a command", () => {
    setup();

    expect(screen.getByText("1")).toBeInTheDocument();
  });
});
