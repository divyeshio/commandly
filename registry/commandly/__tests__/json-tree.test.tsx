import { JsonTree } from "../json-tree";
import {
  allBranches,
  branchesToDepth,
  childPath,
  copyText,
  countLabel,
  entries,
  searchJson,
  typeOf,
  within,
} from "../utils/json-tree";
import { fireEvent, render, screen, within as withinRow } from "@testing-library/react";

const clipboardWriteText = vi.fn<(text: string) => Promise<void>>(() => Promise.resolve());

const numbers = (count: number) => Array.from({ length: count }, (_, index) => index);

beforeEach(() => {
  clipboardWriteText.mockClear();
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: clipboardWriteText },
    configurable: true,
  });
});

describe("json-tree helpers", () => {
  it("classifies values", () => {
    expect(typeOf(null)).toBe("null");
    expect(typeOf([])).toBe("array");
    expect(typeOf({})).toBe("object");
    expect(typeOf("x")).toBe("string");
    expect(typeOf(1)).toBe("number");
    expect(typeOf(true)).toBe("boolean");
    expect(typeOf(undefined)).toBe("other");
  });

  it("lists a value's entries", () => {
    expect(entries([7, 8])).toEqual([
      [0, 7],
      [1, 8],
    ]);
    expect(entries({ a: 1 })).toEqual([["a", 1]]);
    expect(entries("scalar")).toEqual([]);
  });

  it("builds readable child paths", () => {
    expect(childPath("root", "name")).toBe("root.name");
    expect(childPath("root", 2)).toBe("root[2]");
    expect(childPath("root", "a b")).toBe('root["a b"]');
  });

  it("only treats a path prefix as containment at a segment boundary", () => {
    expect(within("root.a", "root.a")).toBe(true);
    expect(within("root.a", "root.a.b")).toBe(true);
    expect(within("root.a", "root.a[0]")).toBe(true);
    expect(within("root.a", "root.ab")).toBe(false);
  });

  it("labels counts by container type", () => {
    expect(countLabel("array", 1)).toBe("1 item");
    expect(countLabel("array", 3)).toBe("3 items");
    expect(countLabel("object", 1)).toBe("1 key");
    expect(countLabel("object", 3)).toBe("3 keys");
  });

  it("renders the copy text for each value shape", () => {
    expect(copyText("x", "string")).toBe("x");
    expect(copyText(null, "null")).toBe("null");
    expect(copyText(true, "boolean")).toBe("true");
  });

  it("copies a branch as the same JSON value, over more than one line", () => {
    const value = { a: 1, b: [true, null] };
    const copied = copyText(value, "object") as string;

    expect(JSON.parse(copied)).toEqual(value);
    expect(copied).toContain("\n");
  });

  it("collects branches, optionally to a depth", () => {
    const data = { a: { b: {} } };
    expect(allBranches(data, "root")).toEqual(["root", "root.a", "root.a.b"]);
    expect(branchesToDepth(data, "root", 2)).toEqual(["root", "root.a"]);
    expect(branchesToDepth(data, "root", 0)).toEqual([]);
  });

  it("records every match with the ancestors and page sizes needed to reveal them", () => {
    const result = searchJson({ a: "foo", b: "foo", c: "bar" }, "root", "foo");

    expect(result.matches).toEqual(["root.a", "root.b"]);
    expect(result.ancestors.has("root")).toBe(true);
    expect(result.needed.get("root")).toBe(2);
  });

  it("matches keys as well as primitive values", () => {
    const result = searchJson({ alpha: 1, beta: 2 }, "root", "alph");

    expect(result.matches).toEqual(["root.alpha"]);
  });
});

describe("JsonTree", () => {
  it("pages a long container and offers the next page", () => {
    render(
      <JsonTree
        data={{ items: numbers(60) }}
        pageSize={10}
      />,
    );

    expect(screen.getByRole("treeitem", { name: "Show 10 more, 50 hidden" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("treeitem", { name: "Show 10 more, 50 hidden" }));

    expect(screen.getByRole("treeitem", { name: "Show 10 more, 40 hidden" })).toBeInTheDocument();
  });

  it("expands and collapses every branch from the toolbar", () => {
    render(
      <JsonTree
        data={{ items: numbers(3) }}
        defaultExpandDepth={0}
      />,
    );

    expect(screen.queryByRole("treeitem", { name: "0: 0" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Expand all" }));
    expect(screen.getByRole("treeitem", { name: "0: 0" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Collapse all" }));
    expect(screen.queryByRole("treeitem", { name: "0: 0" })).not.toBeInTheDocument();
  });

  it("opens a closed branch with the right arrow key", () => {
    render(
      <JsonTree
        data={{ items: numbers(2) }}
        defaultExpandDepth={1}
      />,
    );
    expect(screen.queryByRole("treeitem", { name: "0: 0" })).not.toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole("treeitem", { name: /^root/ }), { key: "ArrowDown" });
    fireEvent.keyDown(screen.getByRole("treeitem", { name: "items, array, 2 items" }), {
      key: "ArrowRight",
    });

    expect(screen.getByRole("treeitem", { name: "0: 0" })).toBeInTheDocument();
  });

  it("steps through matches from the search box", () => {
    render(<JsonTree data={{ a: "foo", b: "foo" }} />);

    const search = screen.getByRole("searchbox", { name: "Search JSON" });
    fireEvent.change(search, { target: { value: "foo" } });
    expect(screen.getByText("1/2")).toBeInTheDocument();

    fireEvent.keyDown(search, { key: "Enter" });
    expect(screen.getByText("2/2")).toBeInTheDocument();

    fireEvent.keyDown(search, { key: "Enter", shiftKey: true });
    expect(screen.getByText("1/2")).toBeInTheDocument();
  });

  it("selects the first match and clears the query on escape", () => {
    render(
      <JsonTree
        data={{ nested: { warm: "needle" } }}
        defaultExpandDepth={1}
      />,
    );
    expect(screen.queryByRole("treeitem", { name: "warm: needle" })).not.toBeInTheDocument();

    const search = screen.getByRole("searchbox", { name: "Search JSON" });
    fireEvent.change(search, { target: { value: "needle" } });

    expect(screen.getByRole("treeitem", { name: "warm: needle" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    fireEvent.keyDown(search, { key: "Escape" });
    expect(search).toHaveValue("");
  });

  it("copies a row's path from the row actions", async () => {
    render(<JsonTree data={{ name: "first" }} />);

    const row = screen.getByRole("treeitem", { name: "name: first" });
    fireEvent.click(withinRow(row).getByRole("button", { name: "Copy path" }));

    await vi.waitFor(() => expect(clipboardWriteText).toHaveBeenCalledWith("root.name"));
  });
});
