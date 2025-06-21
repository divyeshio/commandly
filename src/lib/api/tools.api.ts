import type { Tool } from "@/lib/types/tool-editor";

export async function fetchTools(): Promise<Tool[]> {
  //await new Promise((resolve) => setTimeout(resolve, 3000)); // 3 second delay

  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/tools`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) throw new Error("Fetch failed");
  return response.json();
}

export async function fetchGlobalToolDetails(toolName: string): Promise<Tool> {
  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/tools/${toolName}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  if (!response.ok) throw new Error("Fetch failed");
  return response.json();
}

export interface NewTool {
  displayName: string;
  name: string;
  version?: string;
  description?: string;
}

export async function createNewTool(req: NewTool) {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/tools`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(req),
  });
  if (!response.ok) throw new Error("Creating new tool failed");
  return response.json();
}
