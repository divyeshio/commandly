import { DocsCopyPage } from "@/components/docs/docs-copy-page";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("DocsCopyPage", () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "location", {
      value: { href: "https://commandly.divyeshio.in/docs/tool-renderer" },
      writable: true,
    });
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    Object.defineProperty(globalThis, "fetch", {
      value: fetchMock,
      configurable: true,
      writable: true,
    });
  });

  it("copies the shipped page content from the source URL", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue("# Fetched\n\nLive docs"),
    });

    render(
      <DocsCopyPage
        page={"# Title\n\nSome docs"}
        sourceUrl="https://raw.githubusercontent.com/divyeshio/commandly/refs/heads/main/src/routes/docs/__collection__/tool-renderer.mdx"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /copy page/i }));

    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "https://raw.githubusercontent.com/divyeshio/commandly/refs/heads/main/src/routes/docs/__collection__/tool-renderer.mdx",
      );
      expect(writeText).toHaveBeenCalledWith("# Fetched\n\nLive docs");
    });
  });

  it("renders the secondary copy actions menu", () => {
    render(
      <DocsCopyPage
        page={"# Title\n\nSome docs"}
        sourceUrl="https://raw.githubusercontent.com/divyeshio/commandly/refs/heads/main/src/routes/docs/__collection__/tool-renderer.mdx"
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: /open copy actions/i })[1]);

    expect(screen.getByText("View Markdown")).toBeInTheDocument();
    expect(screen.getByText("Open in ChatGPT")).toBeInTheDocument();
    expect(screen.getByText("Open in Claude")).toBeInTheDocument();
  });
});
