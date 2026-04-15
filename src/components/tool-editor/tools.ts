import { Tool } from "@/components/commandly/types/flat";
import { cleanupTool, exportToStructuredJSON } from "@/components/commandly/utils/flat";
import { tool } from "ai";
import { z } from "zod";

export function applyMergePatch(base: Tool, patch: Partial<Tool>): Tool {
  const merged: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(patch)) {
    if (v === null) {
      delete merged[k];
    } else {
      merged[k] = v;
    }
  }
  return cleanupTool(merged as unknown as Tool);
}

export function createEditTool(getBase: () => Tool, onPreview: (tool: Tool) => void) {
  return tool({
    description:
      "Apply a JSON merge patch to incrementally edit the CLI tool definition. Can be called multiple times for separate changes. Always follow up with applyTool when all edits are complete.",
    inputSchema: z.object({
      summary: z.string().describe("Brief description of this specific edit"),
      patch: z
        .record(z.string(), z.any())
        .describe(
          "Partial<Tool> merge patch — only include top-level fields being changed. Arrays (parameters, commands) must be included in full when modified.",
        ),
    }),
    execute: async ({ summary, patch }) => {
      const base = getBase();
      const previewTool = applyMergePatch(base, patch as Partial<Tool>);
      onPreview(previewTool);
      return { success: true, summary };
    },
  });
}

export function createApplyToolDefinitionTool(onApplied: () => void, onApply: () => void) {
  return tool({
    description:
      "Finalize all edits and present them to the user for approval. Call this exactly once after all editTool calls are complete. This is always the last tool call.",
    inputSchema: z.object({
      summary: z.string().describe("Overall summary of all changes being applied"),
    }),
    needsApproval: true,
    execute: async () => {
      onApplied();
      onApply();
      return { success: true };
    },
  });
}

export function createReadTool(getCurrent: () => Tool) {
  return tool({
    description:
      "Read the current tool JSON to inspect its structure or verify changes. Call this first before any edits. Use the fields parameter to read only specific top-level sections for large tools.",
    inputSchema: z.object({
      reason: z.string().optional().describe("Why you are reading the tool JSON"),
      fields: z
        .array(z.enum(["info", "parameters", "commands", "exclusionGroups"]))
        .optional()
        .describe("Specific top-level fields to read. Omit to read all."),
    }),
    execute: async ({ fields }) => {
      const current = getCurrent();
      const exported = exportToStructuredJSON(current) as Record<string, unknown>;
      if (fields && fields.length > 0) {
        const partial: Record<string, unknown> = {};
        for (const f of fields) {
          if (f in exported) partial[f] = exported[f];
        }
        return { tool: partial, note: `Showing fields: ${fields.join(", ")}` };
      }
      return { tool: exported };
    },
  });
}

export function createTavilySearchTool(apiKey: string) {
  return tool({
    description: "Search the web for CLI tool documentation, help text, or related information.",
    inputSchema: z.object({ query: z.string().describe("The search query") }),
    execute: async ({ query }) => {
      const resp = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: apiKey, query, search_depth: "basic", max_results: 5 }),
      });
      if (!resp.ok) throw new Error("Web search failed");
      const data = (await resp.json()) as {
        results?: { title: string; url: string; content: string }[];
      };
      return {
        query,
        results: data.results?.map((r) => ({ title: r.title, url: r.url, content: r.content })) ?? [],
      };
    },
  });
}

export function createTavilyExtractTool(apiKey: string) {
  return tool({
    description:
      "Extract content from one or more web page URLs. For large pages, use startOffset and maxChars to read in chunks — call again with the next startOffset when hasMore is true.",
    inputSchema: z.object({
      urls: z.array(z.string()).describe("URLs to extract content from"),
      startOffset: z
        .number()
        .optional()
        .describe(
          "Character offset to start reading from (default 0). Use nextOffset from a previous response to continue.",
        ),
      maxChars: z
        .number()
        .optional()
        .describe("Max characters to return per URL (default 6000). Reduce if content is too large to process at once."),
    }),
    execute: async ({ urls, startOffset = 0, maxChars = 6000 }) => {
      const resp = await fetch("https://api.tavily.com/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: apiKey, urls }),
      });
      if (!resp.ok) throw new Error("Content extraction failed");
      const data = (await resp.json()) as {
        results?: { url: string; raw_content: string }[];
      };
      return {
        results: data.results?.map((r) => ({
          url: r.url,
          raw_content: r.raw_content.slice(startOffset, startOffset + maxChars),
          totalChars: r.raw_content.length,
          hasMore: r.raw_content.length > startOffset + maxChars,
          nextOffset: startOffset + maxChars,
        })) ?? [],
      };
    },
  });
}
