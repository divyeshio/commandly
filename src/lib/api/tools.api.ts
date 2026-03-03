import type { Tool } from "@/registry/commandly/lib/types/commandly";
import { createIsomorphicFn } from "@tanstack/react-start";

const GITHUB_RAW_BASE = "https://raw.githubusercontent.com/divyeshio/commandly/refs/heads/main";

export const fetchToolsList = createIsomorphicFn()
  .server(async () => {
    const { promises: fs } = await import("node:fs");
    const { join } = await import("node:path");
    const content = await fs.readFile(join(process.cwd(), "public", "tools.json"), "utf-8");
    return JSON.parse(content) as Partial<Tool>[];
  })
  .client(async () => {
    const url = import.meta.env.DEV ? "/tools.json" : `${GITHUB_RAW_BASE}/public/tools.json`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Fetch failed");
    return response.json() as Promise<Partial<Tool>[]>;
  });

export async function fetchToolDetails(toolName: string): Promise<Tool> {
  const url = import.meta.env.DEV
    ? `/tools-collection/${toolName}.json`
    : `${GITHUB_RAW_BASE}/public/tools-collection/${toolName}.json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Fetch failed");
  return response.json();
}
