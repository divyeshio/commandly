import { defaultTool } from "../../../tests/test-utils";
import { JsonOutput } from "../json-output";
import type { Tool } from "@/components/commandly/types/tool";
import { exportToStructuredJSON } from "@/components/commandly/utils/tool-file";
import { fireEvent, render, screen, within } from "@testing-library/react";

const toJSON = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

const clipboardWriteText = vi.fn<(text: string) => Promise<void>>(() => Promise.resolve());

describe("JsonOutput", () => {
  beforeEach(() => {
    clipboardWriteText.mockClear();
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: clipboardWriteText },
      configurable: true,
    });
  });

  it("renders a description of the output", () => {
    render(<JsonOutput tool={defaultTool()} />);
    expect(screen.getByText(/Structured JSON output/)).toBeInTheDocument();
  });

  it("renders the JSON content as a tree", () => {
    render(<JsonOutput tool={defaultTool()} />);
    expect(screen.getByRole("tree", { name: "Tool JSON" })).toBeInTheDocument();
    expect(screen.getByRole("treeitem", { name: /^root/ })).toBeInTheDocument();
    expect(screen.getByRole("treeitem", { name: "binaryName: my-tool" })).toBeInTheDocument();
    expect(screen.getByRole("treeitem", { name: /^0, object/ })).toBeInTheDocument();
  });

  it("expands a branch when its row is clicked", () => {
    render(<JsonOutput tool={defaultTool()} />);
    expect(screen.queryByRole("treeitem", { name: "key: help" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("treeitem", { name: /^0, object/ }));

    expect(screen.getByRole("treeitem", { name: "key: help" })).toBeInTheDocument();
  });

  it("reveals and highlights matches while searching", () => {
    const { container } = render(<JsonOutput tool={defaultTool()} />);

    fireEvent.change(screen.getByRole("searchbox", { name: "Search JSON" }), {
      target: { value: "help" },
    });

    expect(screen.getByRole("treeitem", { name: "key: help" })).toBeInTheDocument();
    expect(screen.getByText(/^1\/\d+$/)).toBeInTheDocument();
    expect(container.querySelector("mark")).not.toBeNull();
  });

  it("copies a value from the row actions", async () => {
    render(<JsonOutput tool={defaultTool()} />);

    const row = screen.getByRole("treeitem", { name: "binaryName: my-tool" });
    fireEvent.click(within(row).getByRole("button", { name: "Copy value" }));

    await vi.waitFor(() => expect(clipboardWriteText).toHaveBeenCalledWith("my-tool"));
  });

  it("moves the current row with the arrow keys", () => {
    render(<JsonOutput tool={defaultTool()} />);

    fireEvent.keyDown(screen.getByRole("treeitem", { name: /^root/ }), { key: "ArrowDown" });

    expect(screen.getByRole("treeitem", { name: /^\$schema/ })).toHaveFocus();
  });

  it("diffs against the original tool and collapses the unchanged runs", () => {
    const original = defaultTool();
    const changed: Tool = {
      ...original,
      parameters: [
        ...original.parameters,
        {
          key: "--extra",
          displayName: "Extra",
          parameterType: "Option",
          dataType: "String",
        },
      ],
    };

    render(
      <JsonOutput
        tool={changed}
        originalTool={original}
      />,
    );

    expect(screen.queryByRole("tree")).not.toBeInTheDocument();
    expect(screen.getByText(/added/)).toBeInTheDocument();
    expect(screen.getByText(/unchanged line/)).toBeInTheDocument();
  });
});

describe("exportToStructuredJSON", () => {
  it("omits enum, validations, dependencies when empty", () => {
    const result = toJSON(exportToStructuredJSON(defaultTool()));
    result.parameters.forEach((param) => {
      expect(param).not.toHaveProperty("enum");
      expect(param).not.toHaveProperty("validations");
      expect(param).not.toHaveProperty("dependencies");
    });
  });

  it("omits exclusionGroups when empty", () => {
    const result = toJSON(exportToStructuredJSON(defaultTool()));
    expect(result).not.toHaveProperty("exclusionGroups");
  });

  it("includes enum when non-empty", () => {
    const tool = defaultTool();
    tool.parameters[0].enum = {
      values: [
        {
          value: "val",
          displayName: "Val",
          description: "",
          sortOrder: 0,
        },
      ],
      allowMultiple: false,
    };
    const result = exportToStructuredJSON(tool);
    expect(result.parameters[0].enum?.values).toHaveLength(1);
  });

  it("includes validations when non-empty", () => {
    const tool = defaultTool();
    tool.parameters[0].validations = [
      {
        key: "v1",
        validationType: "min_length",
        validationValue: "3",
        errorMessage: "Too short",
      },
    ];
    const result = exportToStructuredJSON(tool);
    expect(result.parameters[0].validations).toHaveLength(1);
  });

  it("includes exclusionGroups when non-empty", () => {
    const tool = defaultTool();
    tool.exclusionGroups = [
      {
        key: "eg1",
        displayName: "Group 1",
        exclusionType: "mutual_exclusive",
        parameterKeys: [tool.parameters[0].key],
      },
    ];
    const result = exportToStructuredJSON(tool);
    expect(result.exclusionGroups).toHaveLength(1);
    expect(result.exclusionGroups![0].parameterKeys).toContain("help");
  });

  it("includes root interactive when enabled", () => {
    const tool: Tool = {
      ...defaultTool(),
      interactive: true,
    };

    const result = exportToStructuredJSON(tool);

    expect(result.interactive).toBe(true);
  });
});
