import { fetchToolDetails } from "@/lib/api/tools.api";
import { isNotFound } from "@tanstack/react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();

/** The error `fetchToolDetails` rejects with, or undefined when it resolves. */
const thrownBy = async (toolName: string): Promise<unknown> => {
  try {
    await fetchToolDetails(toolName);
    return undefined;
  } catch (error) {
    return error;
  }
};

describe("fetchToolDetails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(globalThis, "fetch", {
      value: fetchMock,
      configurable: true,
      writable: true,
    });
  });

  it("raises the router's not-found signal for a tool that is not published", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404 });

    expect(isNotFound(await thrownBy("does-not-exist"))).toBe(true);
  });

  it("surfaces any other failure as a plain error, not a not-found", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 });

    const error = await thrownBy("curl");

    expect(isNotFound(error)).toBe(false);
    expect(error).toBeInstanceOf(Error);
  });

  it("returns the parsed tool when it exists", async () => {
    const tool = { binaryName: "curl", displayName: "curl", commands: [], parameters: [] };
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => tool });

    await expect(fetchToolDetails("curl")).resolves.toEqual(tool);
  });
});
