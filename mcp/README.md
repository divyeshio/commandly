# Commandly MCP Server

A Model Context Protocol (MCP) server that provides access to CLI tool specifications and command generation capabilities from the Commandly tool collection.

## Tools

This MCP server exposes 3 main tools:

### 1. `get-tools-list`

Get a list of all available CLI tools with basic information.

**Parameters:** None

**Returns:** JSON array of tools with name, displayName, description, category, tags, supportedInput, and supportedOutput.

### 2. `get-tool-details`

Get detailed information about a specific CLI tool including all commands and parameters.

**Parameters:**

- `toolName` (string): Name of the tool to get details for

**Returns:** Complete tool specification in flat JSON structure including commands, parameters, exclusion groups, etc.

### 3. `generate-command`

Generate a command string for a specific tool and command with given parameters.

**Parameters:**

- `toolName` (string): Name of the tool
- `commandName` (string): Name of the command to execute
- `parameters` (object, optional): Parameters to pass to the command (key-value pairs)

**Returns:** JSON object with generated command string and metadata.

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
- "Generate a subfinder command to find subdomains for example.com"
- "What parameters does the nmap tool support?"

The MCP server will automatically load and parse tool specifications from the `public/tools-collection/` directory.

## Tool Collection Format

Tools are stored as JSON files in the flat format used by Commandly, which includes:

- Tool metadata (name, description, version, etc.)
- Commands and subcommands with hierarchical relationships
- Parameters with types, flags, validation rules
- Exclusion groups for mutually exclusive options
- Input/output type specifications

This format enables precise command generation and comprehensive tool documentation for LLMs.
