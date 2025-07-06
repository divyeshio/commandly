import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { type Tool } from "@/registry/commandly/lib/types/tool-editor";

const server = new McpServer({
  name: "commandly",
  version: "1.0.0"
});

const TOOLS_COLLECTION_PATH = join(process.cwd(), "public", "tools-collection");

function loadToolsFromCollection(): Tool[] {
  const tools: Tool[] = [];

  try {
    const files = readdirSync(TOOLS_COLLECTION_PATH);

    for (const file of files) {
      if (file.endsWith(".json")) {
        try {
          const filePath = join(TOOLS_COLLECTION_PATH, file);
          const fileContent = readFileSync(filePath, "utf-8");
          const tool = JSON.parse(fileContent) as Tool;
          tools.push(tool);
        } catch (error) {
          console.error(`Error loading tool from ${file}:`, error);
        }
      }
    }
  } catch (error) {
    console.error("Error reading tools collection:", error);
  }

  return tools;
}

function loadTool(toolName: string): Tool | null {
  try {
    const filePath = join(TOOLS_COLLECTION_PATH, `${toolName}.json`);
    const fileContent = readFileSync(filePath, "utf-8");
    return JSON.parse(fileContent) as Tool;
  } catch (error) {
    console.error(`Error loading tool ${toolName}:`, error);
    return null;
  }
}

server.tool(
  "get-tools-list",
  "Get a list of all available CLI tools with basic information",
  {},
  async () => {
    const tools = loadToolsFromCollection();

    const toolsList = tools.map((tool) => ({
      name: tool.name,
      displayName: tool.displayName,
      description: tool.description || "",
      category: tool.category || "",
      tags: tool.tags || [],
      supportedInput: tool.supportedInput,
      supportedOutput: tool.supportedOutput
    }));

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(toolsList, null, 2)
        }
      ]
    };
  }
);

server.tool(
  "get-tool-details",
  "Get detailed information about a specific CLI tool including all commands and parameters",
  {
    toolName: z.string().describe("Name of the tool to get details for")
  },
  async ({ toolName }) => {
    const tool = loadTool(toolName);

    if (!tool) {
      return {
        content: [
          {
            type: "text",
            text: `Tool "${toolName}" not found. Use get-tools-list to see available tools.`
          }
        ]
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(tool, null, 2)
        }
      ]
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Commandly MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
