import type { Tool } from "../types/tool-editor";

export async function fetchTools(): Promise<Tool[]> {
  //await new Promise((resolve) => setTimeout(resolve, 3000)); // 3 second delay

  const response = await fetch(`/api/tools`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  });
  if (!response.ok) throw new Error("Fetch failed");
  return response.json();
}

export async function fetchToolDetails(toolName: string): Promise<Tool> {
  const response = await fetch(`/tools-collection/${toolName}.json`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  });
  if (!response.ok) throw new Error("Fetch failed");
  return response.json();
}
