# Commandly MCP Server

A Model Context Protocol (MCP) server that provides access to CLI tool specifications from the Commandly tool collection.

## Tools

This MCP server exposes 2 tools:

### 1. `get-tools-list`

Get a list of all available CLI tools with basic information.

**Parameters:** None

**Returns:** JSON array with `binaryName`, `displayName`, `description`, and `metadata` for every tool in the collection.

### 2. `get-tool-details`

Get detailed information about a specific CLI tool including all commands and parameters.

**Parameters:**

- `toolName` (string): Name of the tool to get details for

**Returns:** Complete tool specification, including commands, parameters, exclusion groups, etc.

## Usage

To run the MCP server:

```bash
npm run mcp
# or
bun run mcp
```

The server runs on stdio transport and can be integrated with MCP-compatible clients like Claude Desktop.

## Example Usage with LLMs

Once connected, you can ask the LLM to:

- "Show me all available CLI tools"
- "Get detailed information about the subfinder tool"
- "What parameters does the nuclei tool support?"
- "Does httpx have a flag for following redirects?"

The MCP server will automatically load and parse tool specifications from the `public/tools-collection/` directory.

## Tool Collection Format

Tools are stored as JSON files in the Commandly format, which includes:

- Tool metadata (name, description, version, etc.)
- Commands and subcommands with hierarchical relationships
- Parameters with types, flags, validation rules
- Exclusion groups for mutually exclusive options
- Input/output type specifications

This format enables precise command generation and comprehensive tool documentation for LLMs.
