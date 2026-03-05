import { createIsomorphicFn } from "@tanstack/react-start";

const GITHUB_RAW_BASE = "https://raw.githubusercontent.com/divyeshio/commandly/refs/heads/main";

export interface RegistryFile {
  path: string;
  type: string;
  target?: string;
  content?: string;
}

export interface RegistryItem {
  name: string;
  type: string;
  title?: string;
  description?: string;
  dependencies?: string[];
  registryDependencies?: string[];
  files: RegistryFile[];
}

export interface Registry {
  name: string;
  homepage: string;
  items: RegistryItem[];
}

export const fetchRegistryList = createIsomorphicFn()
  .server(async () => {
    const { promises: fs } = await import("node:fs");
    const { join } = await import("node:path");
    const content = await fs.readFile(join(process.cwd(), "public", "r", "registry.json"), "utf-8");
    const registry = JSON.parse(content) as Registry;
    return registry.items;
  })
  .client(async () => {
    const url = import.meta.env.DEV
      ? "/r/registry.json"
      : `${GITHUB_RAW_BASE}/public/r/registry.json`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch registry");
    const registry = (await response.json()) as Registry;
    return registry.items;
  });

export async function fetchRegistryItem(name: string): Promise<RegistryItem> {
  const url = import.meta.env.DEV ? `/r/${name}.json` : `${GITHUB_RAW_BASE}/public/r/${name}.json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch registry item: ${name}`);
  return response.json();
}
